import { MigrationInterface, QueryRunner } from "typeorm";

export class Session1710885458684 implements MigrationInterface {
    name = 'Session1710885458684'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "sessions" (
                "expiredAt" bigint NOT NULL,
                "id" character varying NOT NULL,
                "json" text NOT NULL,
                "destroyedAt" TIMESTAMP,
                CONSTRAINT "PK_3238ef96f18b355b671619111bc" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_4c1989542e47d9e3b98fe32c67" ON "sessions" ("expiredAt")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "public"."IDX_4c1989542e47d9e3b98fe32c67"
        `);
        await queryRunner.query(`
            DROP TABLE "sessions"
        `);
    }

}
