import { MigrationInterface, QueryRunner } from 'typeorm';

// Порядок фотографий животного: первая (position = 0) — обложка.
// Позволяет продавцу/админу выбирать обложку и сохранять порядок снимков.
export class AddImagePosition1781572000000 implements MigrationInterface {
  name = 'AddImagePosition1781572000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "animal_images" ADD COLUMN IF NOT EXISTS "position" integer NOT NULL DEFAULT 0`,
    );
    // Существующим фото расставляем позиции в пределах каждого животного,
    // сохраняя текущий порядок (по id), чтобы обложки не «переехали».
    await queryRunner.query(`
      UPDATE "animal_images" AS ai
      SET "position" = sub.rn - 1
      FROM (
        SELECT "id", ROW_NUMBER() OVER (PARTITION BY "animalId" ORDER BY "id") AS rn
        FROM "animal_images"
      ) AS sub
      WHERE ai."id" = sub."id"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "animal_images" DROP COLUMN IF EXISTS "position"`);
  }
}
