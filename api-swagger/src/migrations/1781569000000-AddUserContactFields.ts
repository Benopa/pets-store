import { MigrationInterface, QueryRunner } from 'typeorm';

// Контактные данные кабинета: адрес доставки, способ оплаты, аватар (URL).
export class AddUserContactFields1781569000000 implements MigrationInterface {
  name = 'AddUserContactFields1781569000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "address" character varying`);
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "paymentMethod" character varying`);
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "avatar" character varying`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "avatar"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "paymentMethod"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "address"`);
  }
}
