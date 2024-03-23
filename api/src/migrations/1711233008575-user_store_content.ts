import { MigrationInterface, QueryRunner } from "typeorm";

export class UserStoreContent1711233008575 implements MigrationInterface {
    name = 'UserStoreContent1711233008575'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "user_stores"
            ADD "content" jsonb NOT NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "user_stores" DROP COLUMN "content"
        `);
    }

}
