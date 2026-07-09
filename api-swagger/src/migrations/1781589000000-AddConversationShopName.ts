import { MigrationInterface, QueryRunner } from 'typeorm';

// Товарный чат по товару магазина ведётся «с магазином»: в диалоге храним снапшот
// названия магазина (как productName). Существующие диалоги бэкфиллим по текущей
// привязке товара к магазину.
export class AddConversationShopName1781589000000 implements MigrationInterface {
  name = 'AddConversationShopName1781589000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "shopName" character varying`,
    );
    await queryRunner.query(`
      UPDATE "conversations" c
      SET "shopName" = s."name"
      FROM "animals" a
      JOIN "shops" s ON s."id" = a."shopId"
      WHERE c."animalId" = a."id" AND c."shopName" IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "conversations" DROP COLUMN IF EXISTS "shopName"`);
  }
}
