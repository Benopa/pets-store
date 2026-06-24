import { MigrationInterface, QueryRunner } from 'typeorm';

// Адрес доставки сохраняется на самом заказе (а не только в профиле покупателя),
// чтобы его было видно в истории и продавцу для отправки.
export class AddOrderAddress1781576000000 implements MigrationInterface {
  name = 'AddOrderAddress1781576000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "address" character varying`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN IF EXISTS "address"`);
  }
}
