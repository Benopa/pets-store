import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, IsNull, Repository } from 'typeorm';

import { Conversation } from '../entities/conversation.entity';
import { ChatAttachment, ChatMessage, ChatSenderRole } from '../entities/chat-message.entity';
import { UserRole } from '../entities/user.entity';
import { UsersService } from '../users/users.service';
import { CreateConversationDto } from './dto/create-conversation.dto';

// Аутентифицированный пользователь из JWT (см. JwtStrategy / ChatGateway).
export interface ChatUser {
  id: string;
  role: UserRole;
}

// Диалог для списка: сам диалог + последнее сообщение + непрочитанные для запросившего.
export interface ConversationSummary {
  conversation: Conversation;
  lastMessage: ChatMessage | null;
  unreadCount: number;
}

const STAFF_ROLES: UserRole[] = ['moderator', 'admin'];

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Conversation)
    private readonly conversationRepo: Repository<Conversation>,
    @InjectRepository(ChatMessage)
    private readonly messageRepo: Repository<ChatMessage>,
    private readonly usersService: UsersService,
  ) {}

  // «Сторона» пользователя в конкретном диалоге. В support-чатах модератор и админ —
  // одна сторона ('moderator'); позиция сообщения (слева/справа) на клиенте
  // определяется сравнением стороны сообщения со своей.
  sideOf(conversation: Conversation, user: ChatUser): ChatSenderRole {
    if (conversation.kind === 'admin-moderator') {
      return user.role === 'admin' ? 'admin' : 'moderator';
    }
    if (conversation.buyerId === user.id) return 'buyer';
    if (conversation.sellerId === user.id) return 'seller';
    return 'moderator';
  }

  // Может ли пользователь видеть диалог и писать в него.
  canAccess(conversation: Conversation, user: ChatUser): boolean {
    const isStaff = STAFF_ROLES.includes(user.role);
    switch (conversation.kind) {
      case 'buyer-seller':
        return conversation.buyerId === user.id || conversation.sellerId === user.id;
      case 'buyer-support':
        return conversation.buyerId === user.id || isStaff;
      case 'seller-support':
        return conversation.sellerId === user.id || isStaff;
      case 'admin-moderator':
        return conversation.moderatorId === user.id || user.role === 'admin';
      default:
        return false;
    }
  }

  async findConversation(id: string): Promise<Conversation> {
    const conversation = await this.conversationRepo.findOne({ where: { id } });
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }
    return conversation;
  }

  private async requireAccess(id: string, user: ChatUser): Promise<Conversation> {
    const conversation = await this.findConversation(id);
    if (!this.canAccess(conversation, user)) {
      throw new ForbiddenException('Not allowed');
    }
    return conversation;
  }

  // Создать диалог или вернуть существующий с тем же ключом. Матрица прав:
  //  buyer-seller    — начинает только покупающая сторона (buyer/seller как покупатель),
  //                    продавец НЕ может первым написать покупателю;
  //  buyer-support   — покупатель; seller-support — продавец;
  //  admin-moderator — модератор (со «своей» стороны) или админ (выбирает модератора).
  async findOrCreateConversation(user: ChatUser, dto: CreateConversationDto) {
    let where: FindOptionsWhere<Conversation>;
    let payload: Partial<Conversation>;

    switch (dto.kind) {
      case 'buyer-seller': {
        if (user.role !== 'buyer' && user.role !== 'seller') {
          throw new ForbiddenException('Only buyers can start a chat with a seller');
        }
        if (!dto.sellerId) {
          throw new BadRequestException('sellerId is required');
        }
        if (dto.sellerId === user.id) {
          throw new BadRequestException('Cannot start a chat with yourself');
        }
        const seller = await this.usersService.findById(dto.sellerId);
        // Владелец товара мог переключить кабинет в «покупателя» — писать ему по
        // товару всё равно можно; отсекаем только staff-роли и курьеров.
        if (seller.role === 'moderator' || seller.role === 'courier') {
          throw new BadRequestException('Recipient is not a seller');
        }
        where = {
          kind: dto.kind,
          buyerId: user.id,
          sellerId: dto.sellerId,
          animalId: dto.animalId ?? IsNull(),
        };
        payload = {
          kind: dto.kind,
          buyerId: user.id,
          sellerId: dto.sellerId,
          animalId: dto.animalId ?? null,
          productName: dto.productName ?? null,
        };
        break;
      }
      case 'buyer-support': {
        if (user.role !== 'buyer') {
          throw new ForbiddenException('Only buyers can open buyer support chats');
        }
        where = { kind: dto.kind, buyerId: user.id };
        payload = { kind: dto.kind, buyerId: user.id };
        break;
      }
      case 'seller-support': {
        if (user.role !== 'seller') {
          throw new ForbiddenException('Only sellers can open seller support chats');
        }
        where = { kind: dto.kind, sellerId: user.id };
        payload = { kind: dto.kind, sellerId: user.id };
        break;
      }
      case 'admin-moderator': {
        let moderatorId: string;
        if (user.role === 'moderator') {
          moderatorId = user.id;
        } else if (user.role === 'admin') {
          if (!dto.moderatorId) {
            throw new BadRequestException('moderatorId is required');
          }
          const moderator = await this.usersService.findById(dto.moderatorId);
          if (moderator.role !== 'moderator') {
            throw new BadRequestException('Recipient is not a moderator');
          }
          moderatorId = dto.moderatorId;
        } else {
          throw new ForbiddenException('Not allowed');
        }
        where = { kind: dto.kind, moderatorId };
        payload = { kind: dto.kind, moderatorId };
        break;
      }
      default:
        throw new BadRequestException('Unknown conversation kind');
    }

    const existing = await this.conversationRepo.findOne({ where });
    if (existing) {
      // Диалог был скрыт этим пользователем — при повторном открытии показываем снова.
      if (existing.deletedFor.includes(user.id)) {
        existing.deletedFor = existing.deletedFor.filter((id) => id !== user.id);
        await this.conversationRepo.save(existing);
      }
      return existing;
    }
    const conversation = this.conversationRepo.create(payload);
    return this.conversationRepo.save(conversation);
  }

  // Список диалогов пользователя (видимость по роли), каждый — с последним сообщением
  // и числом непрочитанных. Скрытые (deletedFor) не показываем.
  async listConversations(user: ChatUser): Promise<ConversationSummary[]> {
    const qb = this.conversationRepo
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.buyer', 'buyer')
      .leftJoinAndSelect('c.seller', 'seller')
      .leftJoinAndSelect('c.moderator', 'moderator');

    if (user.role === 'admin') {
      // Админ видит все support-чаты, чаты с модераторами и свои товарные диалоги
      // (у админских товаров он выступает продавцом).
      qb.where(
        '(c.kind IN (:...kinds) OR (c.kind = :bsKind AND (c."sellerId" = :me OR c."buyerId" = :me)))',
        {
          kinds: ['buyer-support', 'seller-support', 'admin-moderator'],
          bsKind: 'buyer-seller',
          me: user.id,
        },
      );
    } else if (user.role === 'moderator') {
      qb.where(
        '(c.kind IN (:...kinds) OR (c.kind = :staffKind AND c."moderatorId" = :me))',
        {
          kinds: ['buyer-support', 'seller-support'],
          staffKind: 'admin-moderator',
          me: user.id,
        },
      );
    } else {
      // Покупатель и продавец — один пользователь с переключаемым кабинетом:
      // видимость по участию (любой стороной), а не по текущей роли, иначе при
      // смене кабинета «пропадала» половина переписок и продавец не мог ответить.
      qb.where('(c."buyerId" = :me OR c."sellerId" = :me)', { me: user.id });
    }
    qb.andWhere('NOT (c."deletedFor" @> :meJson)', { meJson: JSON.stringify([user.id]) });
    qb.orderBy('c."lastMessageAt"', 'DESC', 'NULLS LAST').addOrderBy('c."createdAt"', 'DESC');

    const conversations = await qb.getMany();
    return Promise.all(conversations.map((c) => this.summarize(c, user)));
  }

  // Диалог + последнее сообщение + непрочитанные для конкретного пользователя.
  async summarize(conversation: Conversation, user: ChatUser): Promise<ConversationSummary> {
    const side = this.sideOf(conversation, user);
    const [lastMessage, unreadCount] = await Promise.all([
      this.messageRepo.findOne({
        where: { conversationId: conversation.id },
        order: { createdAt: 'DESC' },
      }),
      this.messageRepo
        .createQueryBuilder('m')
        .where('m."conversationId" = :id', { id: conversation.id })
        .andWhere('m."senderRole" != :side', { side })
        .andWhere('m."isRead" = false')
        .getCount(),
    ]);
    return { conversation, lastMessage, unreadCount };
  }

  async getMessages(user: ChatUser, conversationId: string): Promise<ChatMessage[]> {
    await this.requireAccess(conversationId, user);
    return this.messageRepo.find({
      where: { conversationId },
      order: { createdAt: 'ASC' },
    });
  }

  async sendMessage(
    user: ChatUser,
    conversationId: string,
    text: string,
    attachments: ChatAttachment[] = [],
  ): Promise<{ conversation: Conversation; message: ChatMessage }> {
    const trimmed = (text ?? '').trim();
    // Вложения загружаются заранее через POST /chat/upload — принимаем только ссылки
    // на нашу статику (никаких data:/javascript: URL) и известные поля.
    const safeAttachments: ChatAttachment[] = (attachments ?? [])
      .filter((a) => a && typeof a.url === 'string' && a.url.startsWith('/uploads/'))
      .slice(0, 10)
      .map((a) => ({
        type: a.type === 'image' ? 'image' : 'file',
        name: String(a.name ?? 'file'),
        size: Number(a.size) || 0,
        url: a.url,
      }));
    if (!trimmed && safeAttachments.length === 0) {
      throw new BadRequestException('Message is empty');
    }
    const conversation = await this.requireAccess(conversationId, user);
    const message = await this.messageRepo.save(
      this.messageRepo.create({
        conversationId,
        senderId: user.id,
        senderRole: this.sideOf(conversation, user),
        text: trimmed,
        attachments: safeAttachments,
      }),
    );
    conversation.lastMessageAt = message.createdAt;
    // Новое сообщение «поднимает» диалог у всех, кто его скрывал.
    conversation.deletedFor = [];
    await this.conversationRepo.save(conversation);
    return { conversation, message };
  }

  // Открытие диалога: все сообщения чужой стороны становятся прочитанными.
  async markRead(user: ChatUser, conversationId: string) {
    const conversation = await this.requireAccess(conversationId, user);
    const side = this.sideOf(conversation, user);
    await this.messageRepo
      .createQueryBuilder()
      .update(ChatMessage)
      .set({ isRead: true })
      .where('"conversationId" = :id', { id: conversationId })
      .andWhere('"senderRole" != :side', { side })
      .andWhere('"isRead" = false')
      .execute();
    return { conversation, readerSide: side };
  }

  // «Удалить чат» = скрыть только у себя; собеседник переписку не теряет.
  async hideForUser(user: ChatUser, conversationId: string) {
    const conversation = await this.requireAccess(conversationId, user);
    if (!conversation.deletedFor.includes(user.id)) {
      conversation.deletedFor = [...conversation.deletedFor, user.id];
      await this.conversationRepo.save(conversation);
    }
    return { status: 'ok' };
  }
}
