import { MigrationInterface, QueryRunner } from 'typeorm';

// Базовая схема БД (5 таблиц) — соответствует состоянию до добавления
// полей профиля пользователя. Поля профиля и новая ролевая модель
// добавляются следующей миграцией AddUserProfileFields.
export class InitialSchema1781567000000 implements MigrationInterface {
  name = 'InitialSchema1781567000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "categories" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        CONSTRAINT "PK_categories" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_categories_name" UNIQUE ("name")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "email" character varying NOT NULL,
        "passwordHash" character varying NOT NULL,
        "role" character varying NOT NULL DEFAULT 'user',
        "apiKey" character varying NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_users" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_users_email" UNIQUE ("email"),
        CONSTRAINT "UQ_users_apiKey" UNIQUE ("apiKey")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "animals" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "species" character varying,
        "description" character varying,
        "gender" character varying,
        "ageMonths" integer,
        "price" numeric,
        "weightKg" numeric,
        "status" character varying NOT NULL DEFAULT 'available',
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "categoryId" uuid,
        "ownerId" uuid,
        CONSTRAINT "PK_animals" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "animal_images" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "url" character varying NOT NULL,
        "animalId" uuid,
        CONSTRAINT "PK_animal_images" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "orders" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "items" jsonb NOT NULL,
        "status" character varying NOT NULL DEFAULT 'created',
        "total" numeric,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "userId" uuid,
        CONSTRAINT "PK_orders" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(
      `ALTER TABLE "animals" ADD CONSTRAINT "FK_animals_category" FOREIGN KEY ("categoryId") REFERENCES "categories"("id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "animals" ADD CONSTRAINT "FK_animals_owner" FOREIGN KEY ("ownerId") REFERENCES "users"("id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "animal_images" ADD CONSTRAINT "FK_animal_images_animal" FOREIGN KEY ("animalId") REFERENCES "animals"("id") ON DELETE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ADD CONSTRAINT "FK_orders_user" FOREIGN KEY ("userId") REFERENCES "users"("id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "orders" DROP CONSTRAINT IF EXISTS "FK_orders_user"`);
    await queryRunner.query(`ALTER TABLE "animal_images" DROP CONSTRAINT IF EXISTS "FK_animal_images_animal"`);
    await queryRunner.query(`ALTER TABLE "animals" DROP CONSTRAINT IF EXISTS "FK_animals_owner"`);
    await queryRunner.query(`ALTER TABLE "animals" DROP CONSTRAINT IF EXISTS "FK_animals_category"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "orders"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "animal_images"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "animals"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "categories"`);
  }
}
