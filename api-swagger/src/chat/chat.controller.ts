import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Request,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { randomUUID } from 'crypto';
import { mkdirSync } from 'fs';

import { ChatService, ChatUser } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

const uploadDir = process.env.UPLOAD_DIR ?? 'uploads';
mkdirSync(uploadDir, { recursive: true });

type AuthedRequest = { user: ChatUser };

@ApiTags('chat')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly chatGateway: ChatGateway,
  ) {}

  // Список моих диалогов: последний месседж + непрочитанные (загружается при входе,
  // поэтому накопленное за оффлайн видно сразу).
  @Get('conversations')
  list(@Request() req: AuthedRequest) {
    return this.chatService.listConversations(req.user);
  }

  @Post('conversations')
  create(@Request() req: AuthedRequest, @Body() dto: CreateConversationDto) {
    return this.chatService.findOrCreateConversation(req.user, dto);
  }

  @Get('conversations/:id/messages')
  messages(@Request() req: AuthedRequest, @Param('id') id: string) {
    return this.chatService.getMessages(req.user, id);
  }

  // Открытие диалога: пометить входящие прочитанными и оповестить собеседника по сокету.
  @Post('conversations/:id/read')
  async markRead(@Request() req: AuthedRequest, @Param('id') id: string) {
    const { conversation, readerSide } = await this.chatService.markRead(req.user, id);
    this.chatGateway.emitRead(conversation, readerSide);
    return { status: 'ok' };
  }

  // «Удалить чат» — скрыть только у себя.
  @Delete('conversations/:id')
  remove(@Request() req: AuthedRequest, @Param('id') id: string) {
    return this.chatService.hideForUser(req.user, id);
  }

  // Загрузка вложения (фото/файл) — тот же паттерн, что аватары и фото товаров.
  @Post('upload')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: uploadDir,
        filename: (
          _req: Express.Request,
          file: Express.Multer.File,
          cb: (error: Error | null, filename: string) => void,
        ) => {
          const ext = file.originalname.split('.').pop() || 'bin';
          cb(null, `${randomUUID()}.${ext}`);
        },
      }),
    }),
  )
  upload(@UploadedFile() file: Express.Multer.File) {
    return {
      type: file.mimetype?.startsWith('image/') ? 'image' : 'file',
      name: file.originalname,
      size: file.size,
      url: `/uploads/${file.filename}`,
    };
  }
}
