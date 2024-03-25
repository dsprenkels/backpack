import * as bodyParser from "body-parser"
import { TypeormStore } from "connect-typeorm"
import * as cors from 'cors'
import * as express from "express"
import * as ExpressSession from 'express-session'
import * as passport from 'passport'
import { Strategy as GitHubStrategy } from 'passport-github'
import { AppDataSource } from "./data-source"
import { OAuthIdentity, Session, User, UserStore } from "./entities"

let port: number
if (process.env.PORT) {
    port = parseInt(process.env.PORT);
} else if (process.env.NODE_ENV === 'development') {
    console.info('No PORT environment variable detected, using default port 3000');
    port = 3000;
} else {
    throw new Error('PORT environment is not set')
}

let rootURL = new URL(process.env.ROOT_URL)
if (rootURL.pathname.endsWith('/')) {
    rootURL.pathname = rootURL.pathname.slice(0, -1)
}

AppDataSource.initialize().then(async () => {
    const app = express();
    if (app.get('env') === 'production') {
        app.set('trust proxy', 1)
    }

    // CORS configuration
    app.use(cors({
        origin: rootURL.origin,
        methods: ["POST", "PUT", "GET", "OPTIONS", "HEAD"],
        credentials: true,
    }));

    // Session configuration
    const sessionSecret = process.env.SESSION_SECRET;
    if (!sessionSecret) {
        throw new Error('SESSION_SECRET environment variable is not set')
    }
    app.use(ExpressSession({
        resave: false,
        saveUninitialized: false,
        store: new TypeormStore({
            cleanupLimit: 2,
        }).connect(AppDataSource.getRepository(Session)),
        secret: sessionSecret,
        cookie: {
            secure: "auto",
        }
    }));

    // Body parser
    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(bodyParser.json())

    // Passport GitHub OAuth configuration
    app.use(passport.initialize());
    app.use(passport.session());
    passport.use(new GitHubStrategy({
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: `${rootURL.toString()}/auth/github/callback`,
    },
        async (accessToken, _refreshToken, profile, done) => {
            let user: User = null
            AppDataSource.transaction(async (manager) => {
                // Find or create a user in the database
                user = await manager.findOneBy(User, { githubID: profile.id })
                if (!user) {
                    user = new User()
                }
                user.githubID = profile.id
                user.githubLogin = profile.username
                user.displayname = profile.displayName
                user.avatarURL = profile.photos[0].value
                await manager.save(user)

                // Register this access token in the database
                let oauthIdentity = await manager.findOneBy(OAuthIdentity, { user: { id: user.id }, provider: 'github' })
                if (!oauthIdentity) {
                    oauthIdentity = new OAuthIdentity()
                }
                oauthIdentity.user = user
                oauthIdentity.provider = 'github'
                oauthIdentity.tokenType = 'Bearer'
                oauthIdentity.accessToken = accessToken
                oauthIdentity.scope = 'user'
                await manager.save(oauthIdentity)
            }).then(() => {
                console.debug(`GitHub user '${user.githubID}' logged in`)
                done(null, user)
            }, (error) => done(error, user))
        }));

    // Serialize and deserialize user instances to and from the session.
    passport.serializeUser(function (user: Express.User, cb) {
        cb(null, { id: (user as User).id })
    });

    passport.deserializeUser(function (user: Express.User, cb) {
        cb(null, user);
    });

    // Routes
    app.get(`${rootURL.pathname}/auth/github/callback`,
        passport.authenticate('github', {
            successRedirect: `${rootURL.pathname}/`,
            failureRedirect: '/backpack/auth/github',
        }),
    );
    app.get(`${rootURL.pathname}/auth/github`, passport.authenticate('github'));

    // Handle userstore API
    app.get(`${rootURL.pathname}/api/userstore`, async (req, res) => {
        if (!req.isAuthenticated()) {
            res.status(401).send('Unauthorized')
            return
        }
        let user = req.user as User
        let repo = AppDataSource.getRepository(UserStore)
        let store = await repo.findOneBy({ user: { id: user.id } })
        res.json(store)
    })
    app.put(`${rootURL.pathname}/api/userstore`, async (req, res) => {
        if (!req.isAuthenticated()) {
            res.status(401).send('Unauthorized')
            return
        }
        let user = req.user as User
        let repo = AppDataSource.getRepository(UserStore)
        let store = await repo.findOneBy({ user: { id: user.id } })
        if (!store) {
            store = new UserStore()
            store.user = user
        }
        store.content = req.body.store
        await repo.save(store)
        res.json(store)
    })

    // Only in development, redirect all other requests to vite
    if (process.env.NODE_ENV === 'development') {
        const { createServer: createViteServer } = require('vite')
        const vite = await createViteServer({
            server: { middlewareMode: true },
            root: '../web',
            logLevel: 'info',
            clearScreen: false,
            build: {
                outDir: 'dist',
                emptyOutDir: true,
            },
        })
        app.use(vite.middlewares)

    }

    // Start express server
    app.listen(port)
    console.debug(`Express server has started at ${rootURL}`)

}).catch(error => console.log(error))
