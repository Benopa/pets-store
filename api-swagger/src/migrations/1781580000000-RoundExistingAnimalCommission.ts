import { MigrationInterface, QueryRunner } from 'typeorm';

// Чиним покупательскую цену существующих товаров: предыдущая миграция считала её как
// ROUND(basePrice * 1.05, 2) и оставляла копейки (999 → 1048.95). Реальное правило сайта —
// комиссия округляется ВНИЗ до целых рублей: price = basePrice + FLOOR(basePrice * commissionRate)
// (как в AnimalsService.withCommission). Пересчитываем по нему — затрагивает уже добавленные
// карточки (в т.ч. админские), у которых из-за округления к копейкам цена в каталоге не целая.
export class RoundExistingAnimalCommission1781580000000 implements MigrationInterface {
  name = 'RoundExistingAnimalCommission1781580000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "animals"
       SET "price" = "basePrice" + FLOOR("basePrice" * "commissionRate")
       WHERE "basePrice" IS NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Откат: возвращаем прежнюю формулу с округлением к копейкам.
    await queryRunner.query(
      `UPDATE "animals"
       SET "price" = ROUND("basePrice" * (1 + "commissionRate"), 2)
       WHERE "basePrice" IS NOT NULL`,
    );
  }
}
