package backpack

import (
	"context"
	"fmt"
	"net/http"
	"strings"
	"time"

	"os"

	"github.com/gin-contrib/cors"
	"github.com/gin-contrib/sessions"
	"github.com/gin-contrib/sessions/cookie"
	"github.com/gin-gonic/gin"
	"github.com/golang/glog"
	"github.com/pkg/errors"
	ginglog "github.com/szuecs/gin-glog"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/github"
)

const MAX_STORE_LENGTH = 131072

var (
	sessionSecret                       = os.Getenv("BACKPACK_SESSION_SECRET")
	github_client_id                    = os.Getenv("BACKPACK_GITHUB_CLIENT_ID")
	github_client_secret                = os.Getenv("BACKPACK_GITHUB_CLIENT_SECRET")
	rootURL                             = os.Getenv("BACKPACK_ROOT_URL")
	oauthConfig          *oauth2.Config = &oauth2.Config{
		RedirectURL:  strings.TrimSuffix(rootURL, "/") + "/auth/github/callback",
		ClientID:     github_client_id,
		ClientSecret: github_client_secret,
		Scopes:       []string{"read:user"},
		Endpoint:     github.Endpoint,
	}
	oauthStateString = "random"
)

type AppConfig struct{}

func App(cfg *AppConfig) {
	defer glog.Flush()

	if err := connectDatabase(); err != nil {
		glog.Fatal(errors.Wrap(err, "opening database"))
	}
	defer closeDatabase()
	if err := migrate(); err != nil {
		glog.Fatal(err)
	}

	setupRouter().Run()
}

func setupRouter() *gin.Engine {
	router := gin.New()
	router.SetTrustedProxies([]string{"localhost"})
	router.Use(ginglog.Logger(5 * time.Second))
	router.Use(gin.Recovery())

	corsConfig := cors.DefaultConfig()
	corsConfig.AllowOrigins = []string{rootURL}
	if gin.DebugMode == "debug" {
		corsConfig.AllowOrigins = append(corsConfig.AllowOrigins, "http://localhost:5173")
		corsConfig.AllowCredentials = true
	}
	router.Use(cors.New(corsConfig))

	if len(sessionSecret) == 0 {
		glog.Fatal("BACKPACK_SESSION_SECRET is empty")
	}
	store := cookie.NewStore([]byte(sessionSecret))
	router.Use(sessions.Sessions("backpack_session", store))

	router.GET("/backpack/auth/login", login)
	router.GET("/backpack/auth/github/callback", oauthCallback)

	router.GET("/backpack/api/userstore", getUserStore)
	router.PUT("/backpack/api/userstore", updateUserStore)
	return router
}

func login(c *gin.Context) {
	url := oauthConfig.AuthCodeURL(oauthStateString)
	c.Redirect(http.StatusTemporaryRedirect, url)
}

func oauthCallback(c *gin.Context) {
	session := sessions.Default(c)
	state := c.Query("state")
	if state != oauthStateString {
		err := fmt.Errorf("invalid oauth state")
		c.AbortWithError(http.StatusUnauthorized, err)
		return
	}

	code := c.Query("code")
	token, err := oauthConfig.Exchange(c, code)
	if err != nil {
		err = errors.Wrap(err, "oauth exchange")
		glog.Error(err)
		c.AbortWithError(http.StatusInternalServerError, err)
		return
	}

	sql := `
INSERT INTO "oauth_identities" ("provider", "token_type", "access_token", "scope")
VALUES($1, $2, $3, $4)
RETURNING "id"
`
	row := db.QueryRow(context.Background(), sql,
		"github",
		token.TokenType,
		token.AccessToken,
		strings.Join(oauthConfig.Scopes, ","),
	)
	var id int
	err = row.Scan(&id)
	if err != nil {
		err = errors.Wrapf(err, "oauth insert into db")
		glog.Error(err)
		c.AbortWithError(http.StatusInternalServerError, err)
		return
	}
	glog.Infof("registered new oauth identity with id %d", id)
	session.Set("oauth_id", id)
	session.Save()
	if err = session.Save(); err != nil {
		err = errors.Wrap(err, "session save")
		glog.Error(err)
		c.AbortWithError(http.StatusInternalServerError, err)
	}
	c.JSON(http.StatusOK, gin.H{"ok": true, "oauth_id": id})
}

func getUserStore(c *gin.Context) {
	session := sessions.Default(c)
	oauth_id := session.Get("oauth_id")

	if oauth_id == nil {
		c.AbortWithError(http.StatusUnauthorized, errors.New("no oauth_id in session"))
		return
	}

	stmt := `SELECT "store" FROM "user_stores" WHERE "identity_id" = $1 LIMIT 1;`
	row := db.QueryRow(context.Background(), stmt, oauth_id)
	var store string
	err := row.Scan(&store)
	if err != nil {
		c.AbortWithError(http.StatusInternalServerError, errors.Wrap(err, "database select"))
		return
	}
	c.JSON(http.StatusOK, gin.H{"ok": true, "store": store})
}

func updateUserStore(c *gin.Context) {
	session := sessions.Default(c)
	oauth_id := session.Get("oauth_id")
	if oauth_id == nil {
		c.AbortWithError(http.StatusUnauthorized, errors.New("no oauth_id in session"))
		return
	}

	var req struct {
		Store string `json:"store" binding:"required"`
	}
	err := c.BindJSON(&req)
	if err != nil {
		c.AbortWithError(http.StatusBadRequest, errors.Wrap(err, "bind json"))
		return
	}
	if len(req.Store) > MAX_STORE_LENGTH {
		c.AbortWithError(http.StatusBadRequest, errors.New("max store size exceeded"))
		return
	}

	var stmt string
	tx, err := db.Begin(context.Background())
	if err != nil {
		c.AbortWithError(http.StatusInternalServerError, errors.Wrap(err, "database begin"))
		return
	}
	defer tx.Rollback(context.Background())
	stmt = `DELETE FROM "user_stores" WHERE "identity_id" = $1`
	_, err = tx.Exec(context.Background(), stmt, oauth_id)
	if err != nil {
		c.AbortWithError(http.StatusInternalServerError, errors.Wrap(err, "database delete"))
		return
	}
	stmt = `INSERT INTO "user_stores" ("identity_id", "store") VALUES ($1, $2)`
	_, err = tx.Exec(context.Background(), stmt, oauth_id, req.Store)
	if err != nil {
		c.AbortWithError(http.StatusInternalServerError, errors.Wrap(err, "database insert"))
		return
	}
	err = tx.Commit(context.Background())
	if err != nil {
		c.AbortWithError(http.StatusInternalServerError, errors.Wrap(err, "database commit"))
		return
	}
	c.JSON(http.StatusOK, gin.H{"ok": true})
}
