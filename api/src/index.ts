import * as bodyParser from "body-parser"
import { TypeormStore } from "connect-typeorm"
import * as cors from 'cors'
import * as express from "express"
import * as ExpressSession from 'express-session'
import * as passport from 'passport'
import { Strategy as GitHubStrategy } from 'passport-github'
import { AppDataSource } from "./data-source"
import { OAuthIdentity, Session, User } from "./entities"


let port: number
if (process.env.PORT) {
    port = parseInt(process.env.PORT);
} else {
    console.info('No PORT environment variable detected, using default port 3000');
    port = 3000;
}

let rootURL = process.env.BACKPACK_ROOT_URL
if (rootURL.endsWith('/')) {
    rootURL = rootURL.slice(0, -1)
}

AppDataSource.initialize().then(async () => {
    const app = express();

    // Bodu parser
    app.use(bodyParser.json())

    // Session configuration
    const sessionSecret = process.env.BACKPACK_SESSION_SECRET;
    if (!sessionSecret) {
        throw new Error('BACKPACK_SESSION_SECRET environment variable is not set')
    }
    app.use(ExpressSession({
        resave: false,
        saveUninitialized: false,
        store: new TypeormStore({
            cleanupLimit: 2,
        }).connect(AppDataSource.getRepository(Session)),
        secret: sessionSecret,
        cookie: {
            secure: app.get('env') === 'production',
        }
    }));

    // CORS configuration
    app.use(cors({
        credentials: true,
        origin: '*' // Adjust according to your needs
    }));

    // Passport GitHub OAuth configuration
    passport.use(new GitHubStrategy({
        clientID: process.env.BACKPACK_GITHUB_CLIENT_ID || '',
        clientSecret: process.env.BACKPACK_GITHUB_CLIENT_SECRET || '',
        callbackURL: `${rootURL}/auth/github/callback`,
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
            }).then(() => done(null, user), (error) => done(error, user))
        }));
    app.use(passport.initialize());
    app.use(passport.session());

    // Serialize and deserialize user instances to and from the session.
    passport.serializeUser(function (user: Express.User, cb) {
        cb(null, { id: (user as User).id })
    });

    passport.deserializeUser(function (user: Express.User, cb) {
        cb(null, user);
    });

    // Routes
    app.get(`${rootURL}/auth/github/callback`,
        passport.authenticate('github', { failureRedirect: '/backpack/auth/github' }),
        function (_req, res) {
            // Successful authentication, redirect home.
            res.redirect(`${rootURL}/`);
        }
    );
    app.get(`${rootURL}/auth/github`, passport.authenticate('github'));

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
    console.debug(`Express server has started at http://localhost:${port}${rootURL}`)

}).catch(error => console.log(error))
