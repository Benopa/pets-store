import { MigrationInterface, QueryRunner } from 'typeorm';

// Остаток товара на складе. Существующим карточкам проставляем 30 шт., чтобы каталог
// сразу был «в наличии». Остаток списывается при оформлении заказа и возвращается при отмене.
export class AddAnimalStock1781577000000 implements MigrationInterface {
  name = 'AddAnimalStock1781577000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "animals" ADD COLUMN IF NOT EXISTS "stock" integer NOT NULL DEFAULT 30`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "animals" DROP COLUMN IF EXISTS "stock"`);
  }
}
