import { MigrationInterface, QueryRunner } from 'typeorm';

// Оплата заказа: способ оплаты (`paymentMethod`: card | sbp | cash) и статус оплаты
// (`paymentStatus`: paid | awaiting | on_delivery). Существующие заказы получают статус
// 'on_delivery' (оплата при получении) — нейтральный дефолт, т.к. способ оплаты у них не сохранён.
export class AddOrderPayment1781581000000 implements MigrationInterface {
  name = 'AddOrderPayment1781581000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "paymentMethod" varchar`);
    await queryRunner.query(
      `ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "paymentStatus" varchar NOT NULL DEFAULT 'on_delivery'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN IF EXISTS "paymentStatus"`);
    await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN IF EXISTS "paymentMethod"`);
  }
}
