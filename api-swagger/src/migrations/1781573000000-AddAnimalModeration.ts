import { MigrationInterface, QueryRunner } from 'typeorm';

// Модерация товаров: продавец загружает карточку → она уходит на проверку модератору,
// который одобряет (показывается в каталоге) или отклоняет с причиной.
// Существующим карточкам ставим 'approved', чтобы каталог не опустел.
export class AddAnimalModeration1781573000000 implements MigrationInterface {
  name = 'AddAnimalModeration1781573000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "animals" ADD COLUMN IF NOT EXISTS "moderationStatus" varchar NOT NULL DEFAULT 'approved'`,
    );
    await queryRunner.query(
      `ALTER TABLE "animals" ADD COLUMN IF NOT EXISTS "rejectReason" varchar`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "animals" DROP COLUMN IF EXISTS "rejectReason"`);
    await queryRunner.query(`ALTER TABLE "animals" DROP COLUMN IF EXISTS "moderationStatus"`);
  }
}
