import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Order } from '../entities/order.entity';
import { User } from '../entities/user.entity';
import { Animal } from '../entities/animal.entity';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { UsersModule } from '../users/users.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ApiKeyGuard } from '../common/guards/api-key.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Order, User, Animal]), UsersModule, NotificationsModule],
  providers: [OrdersService, ApiKeyGuard],
  controllers: [OrdersController],
})
export class OrdersModule {}
