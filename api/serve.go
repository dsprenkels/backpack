package backpack

import (
	"context"
	"net/http"
	"time"

	"os"

	"github.com/gin-contrib/sessions"
	"github.com/gin-contrib/sessions/cookie"
	"github.com/gin-gonic/gin"
	"github.com/golang/glog"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/pkg/errors"
	ginglog "github.com/szuecs/gin-glog"
)

var sessionSecret []byte = []byte(os.Getenv("BACKPACK_SESSION_SECRET"))

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
	if len(sessionSecret) == 0 {
		glog.Fatal("BACKPACK_SESSION_SECRET is empty")
	}
	store := cookie.NewStore([]byte(sessionSecret))
	router.Use(sessions.Sessions("backpack_session", store))

	router.POST("/api/template", newListTemplate)
	router.GET("/api/template/:id", getListTemplate)
	router.PUT("/api/template/:id", updateListTemplate)
	return router
}

type template struct {
	ID       uuid.UUID
	Title    string `json:"title"  binding:"required"`
	Contents string `json:"contents"`
}

func newListTemplate(ctx *gin.Context) {
	var t template
	var err error

	err = ctx.BindJSON(&t)
	if err != nil {
		panic(err)
	}

	sql := `
INSERT INTO "templates" ("title", "contents", "created_at", "updated_at")
VALUES (
	$1,
	$1,
	CURRENT_TIMESTAMP,
	CURRENT_TIMESTAMP
	)
RETURNING "id", "title", "contents";
`
	row := db.QueryRow(context.Background(), sql, t.Title, t.Contents)
	err = row.Scan(&t.ID, &t.Title, &t.Contents)
	if err != nil {
		ctx.AbortWithError(http.StatusInternalServerError,
			errors.Wrap(err, "failed to query database"))
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"id":       t.ID,
		"title":    t.Title,
		"contents": t.Contents,
	})
}

func getListTemplate(ctx *gin.Context) {
	var err error
	var t template

	t.ID, err = uuid.Parse(ctx.Param("id"))
	if err != nil {
		ctx.AbortWithError(http.StatusBadRequest,
			errors.Wrap(err, "could not parse uuid"))
		return
	}

	sql := `
SELECT "title", "contents" FROM "templates" WHERE "id"=$1
`
	err = db.QueryRow(ctx, sql, t.ID).Scan(&t.Title, &t.Contents)
	if err != nil && errors.Is(err, pgx.ErrNoRows) {
		ctx.AbortWithError(http.StatusNotFound,
			errors.Errorf("template %s not found", t.ID))
		return
	}
	if err != nil {
		ctx.AbortWithError(http.StatusInternalServerError,
			errors.Wrap(err, "failed to query database"))
		return
	}
	ctx.JSON(http.StatusOK, gin.H{
		"id":       t.ID,
		"title":    t.Title,
		"contents": t.Contents,
	})
}
func updateListTemplate(ctx *gin.Context) {
	var err error
	var t template

	t.ID, err = uuid.Parse(ctx.Param("id"))
	if err != nil {
		ctx.AbortWithError(http.StatusBadRequest,
			errors.Wrap(err, "could not parse uuid"))
		return
	}

	sql := `
UPDATE "templates"
SET "title" = $1, "contents" = $2, "modified_at" = TIMESTAMP
WHERE "id" = $3
RETURNING "id",	"title", "contents";
	`
	row := db.QueryRow(context.Background(), sql, t.Title, t.Contents, t.ID)
	err = row.Scan(&t.ID, &t.Title, &t.Contents)
	if err != nil && errors.Is(err, pgx.ErrNoRows) {
		ctx.AbortWithError(http.StatusNotFound,
			errors.Errorf("template %s not found", t.ID))
		return
	}
	if err != nil {
		ctx.AbortWithError(http.StatusInternalServerError,
			errors.Wrap(err, "failed to query database"))
		return
	}
	ctx.JSON(http.StatusOK, gin.H{
		"id":       t.ID,
		"title":    t.Title,
		"contents": t.Contents,
	})
}
