import { MigrationInterface, QueryRunner } from 'typeorm';

// Расширяет пользователей полями профиля (имя, фамилия, дата рождения)
// и переводит ролевую модель с 'user' на новую (admin/moderator/seller/buyer).
export class AddUserProfileFields1781568000000 implements MigrationInterface {
  name = 'AddUserProfileFields1781568000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "firstName" character varying`);
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "lastName" character varying`);
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "birthDate" date`);

    // Новая роль по умолчанию + перенос старой роли 'user' в 'buyer'.
    await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'buyer'`);
    await queryRunner.query(`UPDATE "users" SET "role" = 'buyer' WHERE "role" = 'user'`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`UPDATE "users" SET "role" = 'user' WHERE "role" = 'buyer'`);
    await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'user'`);

    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "birthDate"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "lastName"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "firstName"`);
  }
}
