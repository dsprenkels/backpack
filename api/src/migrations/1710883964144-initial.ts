import { MigrationInterface, QueryRunner } from "typeorm";

export class Initial1710883964144 implements MigrationInterface {
    name = 'Initial1710883964144'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "users" (
                "id" SERIAL NOT NULL,
                "githubID" character varying NOT NULL,
                "githubLogin" character varying,
                "displayname" character varying,
                "avatarURL" character varying,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_df5457b99ccfee7ee638c5b081" ON "users" ("githubID")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_204e9b624861ff4a5b26819210" ON "users" ("createdAt")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_0f5cbe00928ba4489cc7312573" ON "users" ("updatedAt")
        `);
        await queryRunner.query(`
            CREATE TABLE "oauth_identities" (
                "id" SERIAL NOT NULL,
                "provider" character varying NOT NULL,
                "tokenType" character varying NOT NULL,
                "accessToken" character varying NOT NULL,
                "scope" character varying NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "userId" integer,
                CONSTRAINT "REL_b731ba99f5f90815d56cd295c4" UNIQUE ("userId"),
                CONSTRAINT "PK_095205cf320039e4ce248933681" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_b731ba99f5f90815d56cd295c4" ON "oauth_identities" ("userId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_69b9224e713dd3856cf2cd3263" ON "oauth_identities" ("provider")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_9d262f2ac3f4c7570b0e0a9dc2" ON "oauth_identities" ("createdAt")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_21989447da722895ec1695bb08" ON "oauth_identities" ("updatedAt")
        `);
        await queryRunner.query(`
            CREATE TABLE "user_stores" (
                "id" SERIAL NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "userId" integer,
                CONSTRAINT "REL_c1ae840a5dd1c3b47e9e0295e7" UNIQUE ("userId"),
                CONSTRAINT "PK_b8f8a8e066cd32b77e78e8f7bfd" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_c1ae840a5dd1c3b47e9e0295e7" ON "user_stores" ("userId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_d5ce91a22571d1c38447a1b25a" ON "user_stores" ("createdAt")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_56d33f74dca4c2234df563e0f5" ON "user_stores" ("updatedAt")
        `);
        await queryRunner.query(`
            ALTER TABLE "oauth_identities"
            ADD CONSTRAINT "FK_b731ba99f5f90815d56cd295c45" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "user_stores"
            ADD CONSTRAINT "FK_c1ae840a5dd1c3b47e9e0295e71" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "user_stores" DROP CONSTRAINT "FK_c1ae840a5dd1c3b47e9e0295e71"
        `);
        await queryRunner.query(`
            ALTER TABLE "oauth_identities" DROP CONSTRAINT "FK_b731ba99f5f90815d56cd295c45"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_56d33f74dca4c2234df563e0f5"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_d5ce91a22571d1c38447a1b25a"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_c1ae840a5dd1c3b47e9e0295e7"
        `);
        await queryRunner.query(`
            DROP TABLE "user_stores"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_21989447da722895ec1695bb08"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_9d262f2ac3f4c7570b0e0a9dc2"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_69b9224e713dd3856cf2cd3263"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_b731ba99f5f90815d56cd295c4"
        `);
        await queryRunner.query(`
            DROP TABLE "oauth_identities"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_0f5cbe00928ba4489cc7312573"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_204e9b624861ff4a5b26819210"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_df5457b99ccfee7ee638c5b081"
        `);
        await queryRunner.query(`
            DROP TABLE "users"
        `);
    }

}
