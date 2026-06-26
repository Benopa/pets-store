import { MigrationInterface, QueryRunner } from 'typeorm';

// Начисляем комиссию сайта 5% на уже существующие товары: текущая цена становится базовой
// (`basePrice` уже = price из предыдущей миграции), а покупательская `price` пересчитывается
// как basePrice * 1.05. Применяется ко всем товарам с нулевой комиссией — разово.
export class ApplyCommissionToExistingAnimals1781579000000 implements MigrationInterface {
  name = 'ApplyCommissionToExistingAnimals1781579000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "animals"
       SET "commissionRate" = 0.05,
           "price" = ROUND("basePrice" * 1.05, 2)
       WHERE "commissionRate" = 0 AND "basePrice" IS NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Откат: возвращаем покупательскую цену к базовой и обнуляем комиссию.
    await queryRunner.query(
      `UPDATE "animals"
       SET "price" = "basePrice",
           "commissionRate" = 0
       WHERE "commissionRate" = 0.05 AND "basePrice" IS NOT NULL`,
    );
  }
}
