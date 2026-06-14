import { MigrationInterface, QueryRunner } from 'typeorm';

// Избранное хранится на сервере (per-user), чтобы переживать выход/вход.
export class AddUserFavorites1781570000000 implements MigrationInterface {
  name = 'AddUserFavorites1781570000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "favorites" jsonb NOT NULL DEFAULT '[]'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "favorites"`);
  }
}
