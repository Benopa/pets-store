import { MigrationInterface, QueryRunner } from 'typeorm';

// Причина отмены заказа: продавец может отменить заказ со своим товаром, указав причину
// (закончился товар, проблема с транспортировкой, долгое ожидание оплаты, другое). Видна покупателю.
export class AddOrderCancelReason1781582000000 implements MigrationInterface {
  name = 'AddOrderCancelReason1781582000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "cancelReason" varchar`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN IF EXISTS "cancelReason"`);
  }
}
