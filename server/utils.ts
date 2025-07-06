import type { ClientBase } from "pg";

export async function withTransaction<T>(client: ClientBase, callback: (client: ClientBase) => Promise<T>): Promise<T> {
    try {
        await client.query('BEGIN');
        const result = await callback(client);
        await client.query('COMMIT');
        return result;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    }
}