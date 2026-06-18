import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';

import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CategoriesModule } from './categories/categories.module';
import { AnimalsModule } from './animals/animals.module';
import { OrdersModule } from './orders/orders.module';
import { ShopsModule } from './shops/shops.module';
import { User } from './entities/user.entity';
import { Category } from './entities/category.entity';
import { Animal } from './entities/animal.entity';
import { AnimalImage } from './entities/animal-image.entity';
import { Order } from './entities/order.entity';
import { Shop } from './entities/shop.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        // synchronize включён по умолчанию для удобства разработки.
        // В проде ставим DB_SYNCHRONIZE=false и применяем схему миграциями.
        const synchronize = config.get<string>('DB_SYNCHRONIZE', 'true') !== 'false';
        return {
          type: 'postgres',
          host: config.get<string>('DB_HOST', 'localhost'),
          port: config.get<number>('DB_PORT', 5432),
          username: config.get<string>('DB_USERNAME', 'app'),
          password: config.get<string>('DB_PASSWORD', 'app'),
          database: config.get<string>('DB_NAME', 'petstore'),
          entities: [User, Category, Animal, AnimalImage, Order, Shop],
          migrations: [join(__dirname, 'migrations', '*.{ts,js}')],
          synchronize,
          // Когда synchronize выключен, прогоняем миграции при старте.
          migrationsRun: !synchronize,
        };
      },
    }),
    AuthModule,
    UsersModule,
    CategoriesModule,
    AnimalsModule,
    OrdersModule,
    ShopsModule,
  ],
})
export class AppModule {}
