import "reflect-metadata"
import { DataSource } from "typeorm"
import { OAuthIdentity, Session, User, UserStore } from "./entities"
import { Initial1710883964144 } from "./migrations/1710883964144-initial"
import { Session1710885458684 } from "./migrations/1710885458684-session"
import { UserStoreContent1711233008575 } from "./migrations/1711233008575-user_store_content"

export const AppDataSource = new DataSource({
    type: "postgres",
    host: "localhost",
    port: 5432,
    username: "backpack_dev",
    password: "m6xi",
    database: "backpack_dev",
    synchronize: true,
    logging: process.env.NODE_ENV === "development",
    entities: [Session, User, OAuthIdentity, UserStore],
    migrations: [Initial1710883964144, Session1710885458684, UserStoreContent1711233008575],
    subscribers: [],
})
