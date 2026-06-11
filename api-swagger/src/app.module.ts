import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CategoriesModule } from './categories/categories.module';
import { AnimalsModule } from './animals/animals.module';
import { OrdersModule } from './orders/orders.module';
import { User } from './entities/user.entity';
import { Category } from './entities/category.entity';
import { Animal } from './entities/animal.entity';
import { AnimalImage } from './entities/animal-image.entity';
import { Order } from './entities/order.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 5432),
        username: config.get<string>('DB_USERNAME', 'app'),
        password: config.get<string>('DB_PASSWORD', 'app'),
        database: config.get<string>('DB_NAME', 'petstore'),
        entities: [User, Category, Animal, AnimalImage, Order],
        synchronize: true,
      }),
    }),
    AuthModule,
    UsersModule,
    CategoriesModule,
    AnimalsModule,
    OrdersModule,
  ],
})
export class AppModule {}
