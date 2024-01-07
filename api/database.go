package backpack

import (
	"context"

	"github.com/golang/glog"
	"github.com/pkg/errors"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Migration = struct {
	Name string
	Up   string
}

var migrations []Migration = []Migration{
	{
		Name: "2024-01-06_142300_oauth_identities",
		Up: `
CREATE TABLE "oauth_identities" (
	"id" SERIAL PRIMARY KEY,
	"provider" TEXT NOT NULL,
	"token_type" TEXT NOT NULL,
	"access_token" TEXT NOT NULL,
	"scope" TEXT NOT NULL,
	"created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "oauth_identities_provider_index" ON "oauth_identities" ("provider");
CREATE INDEX "oauth_identities_created_at_index" ON "oauth_identities" ("created_at");`,
	},
	{
		Name: "2024-01-06_191000_user_stores",
		Up: `
CREATE TABLE "user_stores" (
"id" SERIAL PRIMARY KEY,
"identity_id" INTEGER NOT NULL REFERENCES "oauth_identities" ("id"),
"store" TEXT NOT NULL CHECK (char_length("store") <= 131072),
"created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "user_stores_created_at_index" ON "user_stores" ("created_at");`,
	},
}

var db *pgxpool.Pool

func connectDatabase() error {
	var err error
	cfg, err := pgxpool.ParseConfig(getEnvMust("BACKPACK_DB_URL"))
	if err != nil {
		glog.Fatalf("failed to parse postgres config from 'BACKPACK_DB_URL': %v", err)
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

func getMigrationVersion() (string, error) {
	var err error

	// Create table (if it not exists yet)
	query := `
CREATE TABLE IF NOT EXISTS "migrations" (
	"version" TEXT PRIMARY KEY,
	"migrated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);`
	_, err = db.Exec(context.Background(), query)
	if err != nil {
		return "", nil
	}

	// Get the current migration version
	var version string
	err = db.QueryRow(
		context.Background(),
		`SELECT version FROM migrations ORDER BY migrated_at DESC LIMIT 1;`,
	).Scan(&version)
	return version, err
}

func migrate() error {
	currentVersion, err := getMigrationVersion()
	if err != nil && !errors.Is(err, pgx.ErrNoRows) {
		return errors.Wrap(err, "getMigrationVersion")
	}
	for _, m := range migrations {
		if currentVersion >= m.Name {
			continue
		}
		// Apply this migration
		glog.Infof("Applying %v", m.Name)
		tx, err := db.Begin(context.Background())
		if err != nil {
			return errors.Wrap(err, "pool.Begin")
		}
		defer tx.Rollback(context.Background())
		_, err = tx.Exec(context.Background(), m.Up)
		if err != nil {
			return errors.Wrap(err, "tx.Exec")
		}
		sql := `INSERT INTO "migrations" ("version") VALUES ($1);`
		_, err = tx.Exec(context.Background(), sql, m.Name)
		if err != nil {
			return errors.Wrap(err, "tx.Exec")
		}
		if err := tx.Commit(context.Background()); err != nil {
			return errors.Wrap(err, "tx.Commit")
		}
	}
	return nil
}
