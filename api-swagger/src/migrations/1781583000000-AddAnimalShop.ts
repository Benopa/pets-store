import { MigrationInterface, QueryRunner } from 'typeorm';

// Привязка товара к магазину: товар принадлежит магазину (а не лично администратору).
// shopId nullable, при удалении магазина обнуляется (ON DELETE SET NULL) — товар остаётся в каталоге.
export class AddAnimalShop1781583000000 implements MigrationInterface {
  name = 'AddAnimalShop1781583000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "animals" ADD COLUMN IF NOT EXISTS "shopId" uuid`);
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_animals_shop'
        ) THEN
          ALTER TABLE "animals"
            ADD CONSTRAINT "FK_animals_shop"
            FOREIGN KEY ("shopId") REFERENCES "shops"("id") ON DELETE SET NULL;
        END IF;
      END
      $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "animals" DROP CONSTRAINT IF EXISTS "FK_animals_shop"`);
    await queryRunner.query(`ALTER TABLE "animals" DROP COLUMN IF EXISTS "shopId"`);
  }
}
