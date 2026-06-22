import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AnimalsService } from './animals.service';
import { AnimalsController } from './animals.controller';
import { Animal } from '../entities/animal.entity';
import { Category } from '../entities/category.entity';
import { User } from '../entities/user.entity';
import { AnimalImage } from '../entities/animal-image.entity';
import { UsersModule } from '../users/users.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ApiKeyGuard } from '../common/guards/api-key.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([Animal, Category, User, AnimalImage]),
    UsersModule,
    NotificationsModule,
  ],
  providers: [AnimalsService, ApiKeyGuard],
  controllers: [AnimalsController],
})
export class AnimalsModule {}
