import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { instanceToPlain } from 'class-transformer';
import { Server, Socket } from 'socket.io';

import { ChatService, ChatUser } from './chat.service';
import { Conversation } from '../entities/conversation.entity';
import { ChatAttachment, ChatSenderRole } from '../entities/chat-message.entity';

// Полезная нагрузка от клиента.
interface SendPayload {
  conversationId: string;
  text?: string;
  attachments?: ChatAttachment[];
}

// WebSocket-шлюз чата. Авторизация — JWT в handshake (auth: { token }); невалидный
// токен → немедленный disconnect. Комнаты: user:<id> у каждого; staff — модераторы
// и админы (получают события support-чатов); admins — только админы (сторона
// «администрация» в admin-moderator чатах). События приходят даже при закрытом
// диалоге — по ним обновляются бейдж в шапке и список диалогов.
@WebSocketGateway({ cors: { origin: true, credentials: true } })
export class ChatGateway implements OnGatewayConnection {
  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly chatService: ChatService,
  ) {}

  // Синхронно и по payload-роли — намеренно: await (например, запрос в БД) создаёт
  // гонку с первым emit клиента (client.data.user ещё не записан → Unauthorized).
  // Устаревание роли buyer↔seller здесь безвредно: стороны и доступ в этих видах
  // диалогов считаются по ID, а staff-роли кабинетом не переключаются.
  handleConnection(client: Socket) {
    try {
      const token =
        (client.handshake.auth?.token as string | undefined) ||
        (client.handshake.headers.authorization ?? '').replace(/^Bearer\s+/i, '');
      const payload = this.jwtService.verify<{ sub: string; role: ChatUser['role'] }>(token);
      const user: ChatUser = { id: payload.sub, role: payload.role };
      client.data.user = user;
      client.join(`user:${user.id}`);
      if (user.role === 'moderator' || user.role === 'admin') {
        client.join('staff');
      }
      if (user.role === 'admin') {
        client.join('admins');
      }
    } catch {
      client.disconnect(true);
    }
  }

  // Комнаты-адресаты событий диалога (обе стороны, включая отправителя — так
  // синхронизируются и другие вкладки того же пользователя).
  private roomsFor(conversation: Conversation): string[] {
    switch (conversation.kind) {
      case 'buyer-seller':
        return [`user:${conversation.buyerId}`, `user:${conversation.sellerId}`];
      case 'buyer-support':
        return [`user:${conversation.buyerId}`, 'staff'];
      case 'seller-support':
        return [`user:${conversation.sellerId}`, 'staff'];
      case 'admin-moderator':
        return [`user:${conversation.moderatorId}`, 'admins'];
      default:
        return [];
    }
  }

  @SubscribeMessage('message:send')
  async onSend(@ConnectedSocket() client: Socket, @MessageBody() body: SendPayload) {
    const user = client.data.user as ChatUser | undefined;
    if (!user) return { error: 'Unauthorized' };
    try {
      const { conversation, message } = await this.chatService.sendMessage(
        user,
        body.conversationId,
        body.text ?? '',
        body.attachments ?? [],
      );
      // instanceToPlain применяет @Exclude — PII пользователей не утекает по сокету
      // (по HTTP это делает глобальный ClassSerializerInterceptor).
      this.server.to(this.roomsFor(conversation)).emit('message:new', {
        conversation: instanceToPlain(conversation),
        message: instanceToPlain(message),
      });
      return { status: 'ok', messageId: message.id };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Failed to send' };
    }
  }

  @SubscribeMessage('conversation:read')
  async onRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { conversationId: string },
  ) {
    const user = client.data.user as ChatUser | undefined;
    if (!user) return { error: 'Unauthorized' };
    try {
      const { conversation, readerSide } = await this.chatService.markRead(
        user,
        body.conversationId,
      );
      this.emitRead(conversation, readerSide);
      return { status: 'ok' };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Failed to mark read' };
    }
  }

  // Оповестить участников, что сторона readerSide прочитала диалог (для статуса «прочитано»
  // у отправителя). Используется и контроллером (REST-открытие диалога).
  emitRead(conversation: Conversation, readerSide: ChatSenderRole) {
    this.server.to(this.roomsFor(conversation)).emit('conversation:read', {
      conversationId: conversation.id,
      readerSide,
    });
  }
}
