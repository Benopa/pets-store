import { MigrationInterface, QueryRunner } from 'typeorm';

// Сброс пароля: хеш токена сброса + срок действия (per-user).
export class AddPasswordReset1781587000000 implements MigrationInterface {
  name = 'AddPasswordReset1781587000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "resetTokenHash" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "resetTokenExpires" TIMESTAMP WITH TIME ZONE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "resetTokenExpires"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "resetTokenHash"`);
  }
}
