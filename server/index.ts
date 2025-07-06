// Example Express.js server with tRPC endpoint

import * as express from 'express'
import * as trpcExpress from '@trpc/server/adapters/express'
import { Pool, } from 'pg'
import { autoMigrate } from '@/server/migrations'
import { initTRPC } from '@trpc/server'
import superjson from 'superjson'

// Create a PostgreSQL connection pool
for (const envVar of ['PGUSER', 'PGPASSWORD', 'PGHOST', 'PGPORT', 'PGDATABASE']) {
    if (!process.env[envVar]) {
        console.error(`error: Environment variable ${envVar} is not set.`);
    }
}
const pool = new Pool({
    user: process.env['PGUSER'],
    password: process.env['PGPASSWORD'],
    host: process.env['PGHOST'],
    port: parseInt(process.env['PGPORT'] ?? ''),
    database: process.env['PGDATABASE'],
})

// Migrate the database
// FIXME: The server seems to start bfore this is finished
try {
    await autoMigrate(await pool.connect())
} catch (error) {
    if (error instanceof AggregateError) {
        error.errors.forEach(err => console.error(`error: ${err.message}`));
        throw error;
    }
}

// Define tRPC router
const t = initTRPC.create({
    transformer: superjson,
})
const appRouter = t.router({
    hello: t.procedure.query(() => {
        const rand = Math.floor(Math.random() * 1000)
        return { message: `Hello ${rand}!` }
    }),
})

export type AppRouter = typeof appRouter

const app = express()

app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.info(`${req.method} ${req.originalUrl} ${res.statusCode} - ${duration} ms`);
    });
    next();
});

app.use(
    '/api/hello',
    trpcExpress.createExpressMiddleware({
        router: appRouter,
        createContext: () => ({}),
    })
)

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000

app.listen(PORT, () => {
    console.info(`info: Server listening on port ${PORT}`)
})
