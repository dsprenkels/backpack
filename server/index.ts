// Example Express.js server with tRPC endpoint

import * as express from 'express'
import * as trpcExpress from '@trpc/server/adapters/express'
import { initTRPC } from '@trpc/server'


const t = initTRPC.create()

// Define tRPC router
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
        console.log(`${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
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
    console.log(`Server listening on port ${PORT}`)
})
