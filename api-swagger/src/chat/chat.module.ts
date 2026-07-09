import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Conversation } from '../entities/conversation.entity';
import { ChatMessage } from '../entities/chat-message.entity';
import { Animal } from '../entities/animal.entity';
import { UsersModule } from '../users/users.module';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { ChatGateway } from './chat.gateway';

@Module({
  imports: [
    TypeOrmModule.forFeature([Conversation, ChatMessage, Animal]),
    UsersModule,
    // Свой JwtModule — gateway верифицирует токен из handshake сам (Passport-гарды
    // на WebSocket-соединение не распространяются).
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'change_me',
    }),
  ],
  providers: [ChatService, ChatGateway],
  controllers: [ChatController],
})
export class ChatModule {}
