import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Notification, NotificationType } from '../entities/notification.entity';

// Данные для создания уведомления. Вызывается из других сервисов при наступлении событий.
export interface CreateNotificationInput {
  type: NotificationType;
  title: string;
  body?: string;
  animalId?: string;
}

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
  ) {}

  // Создаёт уведомление для пользователя (точка входа для доменных сервисов).
  async create(userId: string, input: CreateNotificationInput) {
    const notification = this.notificationRepo.create({ userId, ...input });
    return this.notificationRepo.save(notification);
  }

  // Лента пользователя — сначала новые, ограничиваем 50 последними.
  async findForUser(userId: string) {
    return this.notificationRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  // Счётчик непрочитанных — для бейджа в шапке.
  async unreadCount(userId: string) {
    const count = await this.notificationRepo.count({ where: { userId, isRead: false } });
    return { count };
  }

  async markRead(id: string, userId: string) {
    const notification = await this.notificationRepo.findOne({ where: { id } });
    if (!notification) {
      throw new NotFoundException('Notification not found');
    }
    if (notification.userId !== userId) {
      throw new ForbiddenException('Not allowed');
    }
    notification.isRead = true;
    return this.notificationRepo.save(notification);
  }

  async markAllRead(userId: string) {
    await this.notificationRepo.update({ userId, isRead: false }, { isRead: true });
    return { status: 'ok' };
  }
}
