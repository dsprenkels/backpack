import { ISession } from "connect-typeorm";
import { Column, CreateDateColumn, DeleteDateColumn, Entity, Index, JoinColumn, OneToOne, PrimaryColumn, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity("sessions")
export class Session implements ISession {
    @Column("bigint")
    @Index()
    expiredAt = Date.now()

    @PrimaryColumn()
    id: string

    @Column("text")
    json: string;

    @DeleteDateColumn()
    destroyedAt?: Date;
}

@Entity("users")
export class User {
    @PrimaryGeneratedColumn()
    id: string

    @Column()
    @Index()
    githubID: string

    @Column({ nullable: true })
    githubLogin?: string

    @Column({ nullable: true })
    displayname?: string

    @Column({ nullable: true })
    avatarURL?: string

    @CreateDateColumn()
    @Index()
    createdAt: Date

    @Index()
    @UpdateDateColumn()
    updatedAt: Date
}

@Entity("oauth_identities")
export class OAuthIdentity {
    @PrimaryGeneratedColumn()
    id: string

    @OneToOne(type => User)
    @JoinColumn()
    @Index()
    user: User

    @Column()
    @Index()
    provider: string

    @Column()
    tokenType: string

    @Column()
    accessToken: string

    @Column()
    scope: string

    @CreateDateColumn()
    @Index()
    createdAt: Date

    @UpdateDateColumn()
    @Index()
    updatedAt: Date
}


@Entity("user_stores")
export class UserStore {
    @PrimaryGeneratedColumn()
    id: string

    @OneToOne(type => User)
    @JoinColumn()
    @Index()
    user: User

    @CreateDateColumn()
    @Index()
    createdAt: Date

    @UpdateDateColumn()
    @Index()
    updatedAt: Date
}

