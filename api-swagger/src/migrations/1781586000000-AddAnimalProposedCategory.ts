import { MigrationInterface, QueryRunner } from 'typeorm';

// Предложение новой категории продавцом. При создании товара продавец может вписать новую
// категорию — её название хранится в animals.proposedCategoryName до модерации. Модератор при
// одобрении либо создаёт категорию (тогда она появляется в общем списке), либо назначает
// существующую. Столбец categoryId в БД уже nullable — товар без категории допустим на время
// проверки.
export class AddAnimalProposedCategory1781586000000 implements MigrationInterface {
  name = 'AddAnimalProposedCategory1781586000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "animals" ADD COLUMN IF NOT EXISTS "proposedCategoryName" varchar`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "animals" DROP COLUMN IF EXISTS "proposedCategoryName"`);
  }
}
