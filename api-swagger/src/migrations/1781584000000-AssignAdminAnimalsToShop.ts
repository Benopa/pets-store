import { MigrationInterface, QueryRunner } from 'typeorm';

// Разовый перенос: все товары, записанные на администратора и ещё без магазина,
// привязываем к существующему магазину (берём самый старый из справочника).
// Идемпотентно: затрагивает только товары админа с shopId IS NULL и только при наличии магазинов.
export class AssignAdminAnimalsToShop1781584000000 implements MigrationInterface {
  name = 'AssignAdminAnimalsToShop1781584000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "animals"
       SET "shopId" = (SELECT "id" FROM "shops" ORDER BY "createdAt" ASC LIMIT 1)
       WHERE "shopId" IS NULL
         AND "ownerId" IN (SELECT "id" FROM "users" WHERE "role" = 'admin')
         AND EXISTS (SELECT 1 FROM "shops")`,
    );
  }

  public async down(): Promise<void> {
    // Разовый бэкфилл данных — надёжно откатить нельзя (после переноса не отличить
    // эти товары от тех, что привязали к магазину штатно). Оставляем без отката.
  }
}
