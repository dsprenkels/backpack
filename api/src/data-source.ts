import "reflect-metadata"
import { DataSource } from "typeorm"
import { OAuthIdentity, Session, User, UserStore } from "./entities"
import { Initial1711269614292 } from "./migration/1711269614292-initial"

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
    migrations: [Initial1711269614292],
    subscribers: [],
})
