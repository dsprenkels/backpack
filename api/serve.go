package backpack

import (
	"context"
	"encoding/json"
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
	"github.com/jackc/pgx/v5"
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
	rootURL                             = strings.TrimSuffix(os.Getenv("BACKPACK_ROOT_URL"), "/")
	rootPath                            = urlParseMust(rootURL).Path
	oauthConfig          *oauth2.Config = &oauth2.Config{
		RedirectURL:  rootURL + "/auth/github/callback",
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
	corsConfig.AllowOrigins = []string{"*"}
	corsConfig.AllowCredentials = true
	router.Use(cors.New(corsConfig))

	if len(sessionSecret) == 0 {
		glog.Fatal("BACKPACK_SESSION_SECRET is empty")
	}
	store := cookie.NewStore([]byte(sessionSecret))
	router.Use(sessions.Sessions("backpack_session", store))

	router.GET(rootPath+"/auth/login", login)
	router.GET(rootPath+"/auth/github/callback", oauthCallback)

	router.GET(rootPath+"/api/user", getUser)
	router.GET(rootPath+"/api/userstore", getUserStore)
	router.PUT(rootPath+"/api/userstore", updateUserStore)
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

	// Request the github user id and couple this oauth identity to that user id
	req, err := http.NewRequest("GET", "https://api.github.com/user", nil)
	if err != nil {
		err = errors.Wrap(err, "new request")
		glog.Error(err)
		c.AbortWithError(http.StatusInternalServerError, err)
		return
	}
	req.Header.Set("Accept", "application/vnd.github+json")
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", token.AccessToken))
	req.Header.Set("X-GitHub-Api-Version", "2022-11-28")
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		err = errors.Wrap(err, "do request")
		glog.Error(err)
		c.AbortWithError(http.StatusInternalServerError, err)
		return
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		err = fmt.Errorf("github api returned %d", resp.StatusCode)
		glog.Error(err)
		c.AbortWithError(http.StatusInternalServerError, err)
		return
	}
	var githubUser struct {
		ID          int    `json:"id"`
		Login       string `json:"login"`
		DisplayName string `json:"name"`
		AvatarURL   string `json:"avatar_url"`
	}
	err = json.NewDecoder(resp.Body).Decode(&githubUser)
	if err != nil {
		err = errors.Wrap(err, "decode json")
		glog.Error(err)
		c.AbortWithError(http.StatusInternalServerError, err)
		return
	}

	tx, err := db.Begin(context.Background())
	if err != nil {
		err = errors.Wrap(err, "database begin")
		glog.Error(err)
		c.AbortWithError(http.StatusInternalServerError, err)
		return
	}
	defer tx.Rollback(context.Background())
	sql := `
INSERT INTO "users" ("github_id", "github_login", "displayname", "avatar_url")
VALUES($1, $2, $3, $4) ON CONFLICT ("github_id") DO UPDATE SET "github_login" = $2, "displayname" = $3, "avatar_url" = $4 RETURNING "id"
`
	row := tx.QueryRow(context.Background(), sql, githubUser.ID, githubUser.Login, githubUser.DisplayName, githubUser.AvatarURL)
	var userID int
	err = row.Scan(&userID)
	if err != nil {
		err = errors.Wrapf(err, "insert into users")
		glog.Error(err)
		c.AbortWithError(http.StatusInternalServerError, err)
		return
	}
	glog.Infof("registered new user with id %d", userID)
	sql = `
INSERT INTO "oauth_identities" ("user_id", "provider", "token_type", "access_token", "scope")
VALUES($1, $2, $3, $4, $5)
RETURNING "id"
`
	row = tx.QueryRow(context.Background(), sql,
		userID,
		"github",
		token.TokenType,
		token.AccessToken,
		strings.Join(oauthConfig.Scopes, ","),
	)
	var oauthID int
	err = row.Scan(&oauthID)
	if err != nil {
		err = errors.Wrapf(err, "oauth insert into db")
		glog.Error(err)
		c.AbortWithError(http.StatusInternalServerError, err)
		return
	}
	glog.Infof("registered new oauth identity with id %d", oauthID)
	if err = session.Save(); err != nil {
		err = errors.Wrap(err, "session save")
		glog.Error(err)
		c.AbortWithError(http.StatusInternalServerError, err)
	}
	tx.Commit(context.Background())

	// Update session
	session.Set("user_id", userID)
	session.Set("oauth_id", oauthID)
	if err = session.Save(); err != nil {
		err = errors.Wrap(err, "session save")
		glog.Error(err)
		c.AbortWithError(http.StatusInternalServerError, err)
	}

	c.Redirect(http.StatusTemporaryRedirect, rootURL)
}

func getUser(c *gin.Context) {
	session := sessions.Default(c)
	user_id := session.Get("user_id")
	if user_id == nil {
		c.AbortWithError(http.StatusUnauthorized, errors.New("no user_id in session"))
		return
	}
	sql := `SELECT "id", "github_login", "displayname", "avatar_url" FROM "users" WHERE "id" = $1 LIMIT 1;`
	row := db.QueryRow(context.Background(), sql, user_id)
	var user struct {
		ID          int    `json:"id"`
		GitHubLogin string `json:"github_login"`
		DisplayName string `json:"displayname"`
		AvatarURL   string `json:"avatar_url"`
	}
	err := row.Scan(&user.ID, &user.GitHubLogin, &user.DisplayName, &user.AvatarURL)
	if errors.Is(err, pgx.ErrNoRows) {
		c.AbortWithError(http.StatusNotFound, errors.New("no user found"))
		return
	} else if err != nil {
		c.AbortWithError(http.StatusInternalServerError, errors.Wrap(err, "database select"))
		return
	}
	c.JSON(http.StatusOK, gin.H{"ok": true, "user": user})
}

func getUserStore(c *gin.Context) {
	session := sessions.Default(c)
	user_id := session.Get("user_id")

	if user_id == nil {
		c.AbortWithError(http.StatusUnauthorized, errors.New("no user_id in session"))
		return
	}

	sql := `SELECT "store" FROM "user_stores" WHERE "user_id" = $1 LIMIT 1;`
	row := db.QueryRow(context.Background(), sql, user_id)
	var store string
	err := row.Scan(&store)
	if errors.Is(err, pgx.ErrNoRows) {
		c.AbortWithError(http.StatusNotFound, errors.New("no store found"))
		return
	} else if err != nil {
		c.AbortWithError(http.StatusInternalServerError, errors.Wrap(err, "database select"))
		return
	}
	c.JSON(http.StatusOK, gin.H{"ok": true, "store": store})
}

func updateUserStore(c *gin.Context) {
	session := sessions.Default(c)
	user_id := session.Get("user_id")
	if user_id == nil {
		c.AbortWithError(http.StatusUnauthorized, errors.New("no user_id in session"))
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

	var sql string
	tx, err := db.Begin(context.Background())
	if err != nil {
		c.AbortWithError(http.StatusInternalServerError, errors.Wrap(err, "database begin"))
		return
	}
	defer tx.Rollback(context.Background())
	sql = `DELETE FROM "user_stores" WHERE "user_id" = $1`
	_, err = tx.Exec(context.Background(), sql, user_id)
	if err != nil {
		c.AbortWithError(http.StatusInternalServerError, errors.Wrap(err, "database delete"))
		return
	}
	sql = `INSERT INTO "user_stores" ("user_id", "store") VALUES ($1, $2)`
	_, err = tx.Exec(context.Background(), sql, user_id, req.Store)
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
