import { MigrationInterface, QueryRunner } from 'typeorm';

// Комиссия сайта на товары продавцов. К базовой цене продавца (`basePrice`) добавляется
// `commissionRate` (для новых товаров продавцов — 5%), и покупательская `price` уже включает
// комиссию. Существующим карточкам ставим basePrice = price и комиссию 0 — их цена не меняется.
export class AddAnimalCommission1781578000000 implements MigrationInterface {
  name = 'AddAnimalCommission1781578000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "animals" ADD COLUMN IF NOT EXISTS "basePrice" numeric`);
    await queryRunner.query(
      `ALTER TABLE "animals" ADD COLUMN IF NOT EXISTS "commissionRate" numeric NOT NULL DEFAULT 0`,
    );
    // Базовая цена существующих товаров = их текущая цена (комиссия 0 → цена не изменится).
    await queryRunner.query(`UPDATE "animals" SET "basePrice" = "price" WHERE "basePrice" IS NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "animals" DROP COLUMN IF EXISTS "commissionRate"`);
    await queryRunner.query(`ALTER TABLE "animals" DROP COLUMN IF EXISTS "basePrice"`);
  }
}
