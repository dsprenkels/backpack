package backpack

import (
	"context"

	"github.com/golang/glog"
	"github.com/pkg/errors"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	pgxUUID "github.com/vgarvardt/pgx-google-uuid/v5"
)

var db *pgxpool.Pool

func connectDatabase() error {
	var err error
	cfg, err := pgxpool.ParseConfig(getEnvMust("BACKPACK_DB_URL"))
	if err != nil {
		glog.Fatalf("failed to parse postgres config from 'BACKPACK_DB_URL': %v", err)
	}
	cfg.AfterConnect = func(ctx context.Context, c *pgx.Conn) error {
		pgxUUID.Register(c.TypeMap())
		return nil
	}
	var numConns int32 = 2
	cfg.MinConns = numConns
	cfg.MaxConns = numConns
	db, err = pgxpool.NewWithConfig(context.Background(), cfg)
	return err
}

func closeDatabase() {
	db.Close()
}

func getMigrationVersion() (int, error) {
	var err error

	// Create table (if it not exists yet)
	query := `
CREATE TABLE IF NOT EXISTS "migrations" (
	"version" INTEGER PRIMARY KEY,
	"migrated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
	`
	_, err = db.Exec(context.Background(), query)
	if err != nil {
		return -1, nil
	}

	// Get the current migration version
	var version int
	err = db.QueryRow(
		context.Background(),
		`SELECT version FROM migrations ORDER BY version DESC LIMIT 1`,
	).Scan(&version)
	if err != nil && errors.Is(err, pgx.ErrNoRows) {
		return 0, nil
	}
	if err != nil {
		return version, err
	}
	return version, nil
}

func migrate() error {
	currentVersion, err := getMigrationVersion()
	if err != nil {
		return errors.Wrap(err, "getMigrationVersion")
	}

	if currentVersion < 1 {
		glog.Info("migrating database to version 1")
		tx, err := db.Begin(context.Background())
		if err != nil {
			return errors.Wrap(err, "pool.Begin")
		}
		defer tx.Rollback(context.Background())

		query := `
CREATE TABLE "templates" (
	"id" UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
	"title" TEXT NOT NULL,
	"contents" TEXT NOT NULL,
	"created_at" TIMESTAMP,
	"updated_at" TIMESTAMP
);

CREATE INDEX "templates_created_at_index" ON "templates" ("created_at");

CREATE INDEX "templates_updated_at_index" ON "templates" ("updated_at");

INSERT INTO "migrations" ("version") VALUES (
	1
);
		`
		_, err = tx.Exec(context.Background(), query)
		if err != nil {
			return errors.Wrap(err, "tx.Exec")
		}
		if err := tx.Commit(context.Background()); err != nil {
			return errors.Wrap(err, "tx.Commit")
		}
	}
	return nil
}
