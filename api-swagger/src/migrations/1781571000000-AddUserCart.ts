import { MigrationInterface, QueryRunner } from 'typeorm';

// Корзина хранится на сервере (per-user), чтобы переживать выход/вход.
export class AddUserCart1781571000000 implements MigrationInterface {
  name = 'AddUserCart1781571000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "cart" jsonb NOT NULL DEFAULT '[]'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "cart"`);
  }
}
