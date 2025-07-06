// --- Migration 0001: Create migrations table ---

import type { ClientBase } from "pg";
import { withTransaction } from "./utils";

const migration_0001_up = `
CREATE TABLE IF NOT EXISTS migrations (
    id SERIAL PRIMARY KEY,
    migration INTEGER NOT NULL UNIQUE,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
`;

const migration_0001_down = `
DROP TABLE IF EXISTS migrations;
`;

// --- Migration 0002: Create users table ---

const migration_0002_up = `
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT NOT NULL UNIQUE,
    password JSONB NOT NULL DEFAULT '{}' CHECK (jsonb_typeof(password) = 'object'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX users_createdat_id_idx ON users (created_at, id);
CREATE UNIQUE INDEX users_updatedat_id_idx ON users (updated_at, id);
`;

const migration_0002_down = `
DROP INDEX IF EXISTS users_createdat_id_idx;
DROP INDEX IF EXISTS users_updatedat_id_idx;
DROP TABLE IF EXISTS users;
`;

const migrations = {
    1: { up: migration_0001_up, down: migration_0001_down },
    2: { up: migration_0002_up, down: migration_0002_down },
}

async function getCurrentMigration(client: ClientBase): Promise<number> {
    // Check if the migrations table exists
    const tableExists = await client.query(`
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = 'migrations'
        );
    `);

    if (!tableExists.rows[0].exists) {
        console.debug('debug: Migrations table does not exist, returning 0');
        return 0; // No migrations have been applied
    }

    // Return the current migration number, or 0 if no migrations have been applied
    const result = await client.query('SELECT COALESCE(MAX(migration), 0) AS current FROM migrations');
    return parseInt(result.rows[0]['current']);
}

async function migrateUp(client: ClientBase, towards: number): Promise<void> {
    for (const [migrationNo, migration] of Object.entries(migrations)) {
        withTransaction(client, async (client) => {
            const currentMigration = await getCurrentMigration(client);
            if (currentMigration >= towards) {
                return; // No need to apply migrations above the target
            }
            if (currentMigration < parseInt(migrationNo)) {
                console.info(`info: Applying migration ${migrationNo}`);
                await client.query(migration.up);
                await client.query('INSERT INTO migrations (migration) VALUES ($1)', [migrationNo]);
            }
        });
    }
}

async function migrateDown(client: ClientBase, towards: number): Promise<void> {
    for (const [migrationNo, migration] of Object.entries(migrations).reverse()) {
        withTransaction(client, async (client) => {
            const currentMigration = await getCurrentMigration(client);
            if (currentMigration <= towards) {
                return; // No need to apply migrations below the target
            }
            if (currentMigration >= parseInt(migrationNo)) {
                console.info(`info: Reverting migration ${migrationNo}`);
                await client.query('DELETE FROM migrations WHERE migration = $1', [migrationNo]);
                await client.query(migration.down);
            }
        });
    }
}

export async function autoMigrate(client: ClientBase): Promise<void> {
    // Apply all migrations up to the latest one
    await migrateUp(client, Object.keys(migrations).length);
    if (!await isMigrated(client)) {
        throw new Error('error: Database is not fully migrated. Please check the migration scripts.');
    }
}

export async function isMigrated(client: ClientBase): Promise<boolean> {
    // Check if the latest migration has been applied
    const currentMigration = await getCurrentMigration(client);
    return currentMigration === Object.keys(migrations).length;
}