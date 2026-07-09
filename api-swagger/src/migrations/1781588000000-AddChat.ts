import { MigrationInterface, QueryRunner } from 'typeorm';

// Чат: диалоги (conversations) и сообщения (chat_messages).
// Стороны диалога зависят от kind (см. conversation.entity.ts); «удаление» чата —
// per-user скрытие через jsonb deletedFor. Сообщения — текст + вложения (jsonb) + isRead.
export class AddChat1781588000000 implements MigrationInterface {
  name = 'AddChat1781588000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "conversations" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "kind" character varying NOT NULL,
        "buyerId" uuid,
        "sellerId" uuid,
        "moderatorId" uuid,
        "animalId" uuid,
        "productName" character varying,
        "deletedFor" jsonb NOT NULL DEFAULT '[]',
        "lastMessageAt" TIMESTAMP WITH TIME ZONE,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_conversations" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `ALTER TABLE "conversations" ADD CONSTRAINT "FK_conversations_buyer" FOREIGN KEY ("buyerId") REFERENCES "users"("id") ON DELETE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "conversations" ADD CONSTRAINT "FK_conversations_seller" FOREIGN KEY ("sellerId") REFERENCES "users"("id") ON DELETE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "conversations" ADD CONSTRAINT "FK_conversations_moderator" FOREIGN KEY ("moderatorId") REFERENCES "users"("id") ON DELETE CASCADE`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_conversations_buyer" ON "conversations" ("buyerId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_conversations_seller" ON "conversations" ("sellerId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_conversations_moderator" ON "conversations" ("moderatorId")`,
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "chat_messages" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "conversationId" uuid NOT NULL,
        "senderId" uuid NOT NULL,
        "senderRole" character varying NOT NULL,
        "text" character varying NOT NULL DEFAULT '',
        "attachments" jsonb NOT NULL DEFAULT '[]',
        "isRead" boolean NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_chat_messages" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `ALTER TABLE "chat_messages" ADD CONSTRAINT "FK_chat_messages_conversation" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_chat_messages_conversation" ON "chat_messages" ("conversationId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_chat_messages_conversation"`);
    await queryRunner.query(
      `ALTER TABLE "chat_messages" DROP CONSTRAINT IF EXISTS "FK_chat_messages_conversation"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "chat_messages"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_conversations_moderator"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_conversations_seller"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_conversations_buyer"`);
    await queryRunner.query(
      `ALTER TABLE "conversations" DROP CONSTRAINT IF EXISTS "FK_conversations_moderator"`,
    );
    await queryRunner.query(
      `ALTER TABLE "conversations" DROP CONSTRAINT IF EXISTS "FK_conversations_seller"`,
    );
    await queryRunner.query(
      `ALTER TABLE "conversations" DROP CONSTRAINT IF EXISTS "FK_conversations_buyer"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "conversations"`);
  }
}
