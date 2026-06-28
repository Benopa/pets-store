import 'reflect-metadata';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { join } from 'path';
import * as express from 'express';

import { AppModule } from './app.module';
import { UsersService } from './users/users.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // Глобально вырезаем @Exclude-поля (passwordHash, apiKey, PII пользователя) из
  // сериализуемых сущностей — в т.ч. из вложенных owner/user. Ответы, собранные руками
  // (toProfile/issueTokens), это не затрагивает: они plain-объекты.
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  app.use('/uploads', express.static(join(process.cwd(), 'uploads')));

  const config = new DocumentBuilder()
    .setTitle('Petstore API')
    .setDescription('Petstore-like API with JWT auth')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const usersService = app.get(UsersService);
  await usersService.ensureAdminUser();

  await app.listen(3000);
}

bootstrap();
