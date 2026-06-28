import { MigrationInterface, QueryRunner } from 'typeorm';

// Отказ от авторизации по x-api-key — все защищённые запросы идут на JWT (Bearer).
// Удаляем ставший ненужным столбец users.apiKey (вместе с его UNIQUE-ограничением).
export class RemoveUserApiKey1781585000000 implements MigrationInterface {
  name = 'RemoveUserApiKey1781585000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "apiKey"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Возврат столбца (значения не восстанавливаются): nullable, без UNIQUE.
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "apiKey" character varying`);
  }
}
