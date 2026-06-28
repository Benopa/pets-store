import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiQuery, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { randomUUID } from 'crypto';
import { mkdirSync } from 'fs';

import { AnimalsService } from './animals.service';
import { CreateAnimalDto } from './dto/create-animal.dto';
import { UpdateAnimalDto } from './dto/update-animal.dto';
import { RejectAnimalDto } from './dto/reject-animal.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { User } from '../entities/user.entity';

const uploadDir = process.env.UPLOAD_DIR ?? 'uploads';
mkdirSync(uploadDir, { recursive: true });

@ApiTags('animals')
@Controller('animals')
export class AnimalsController {
  constructor(private readonly animalsService: AnimalsService) {}

  @Get()
  @ApiQuery({ name: 'categoryId', required: false })
  @ApiQuery({ name: 'species', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'moderationStatus', required: false, enum: ['pending', 'approved', 'rejected'] })
  @ApiQuery({ name: 'name', required: false })
  @ApiQuery({ name: 'minPrice', required: false })
  @ApiQuery({ name: 'maxPrice', required: false })
  @ApiQuery({ name: 'minAgeMonths', required: false })
  @ApiQuery({ name: 'maxAgeMonths', required: false })
  @ApiQuery({ name: 'sortBy', required: false, enum: ['createdAt', 'price', 'ageMonths', 'name'] })
  @ApiQuery({ name: 'order', required: false, enum: ['ASC', 'DESC'] })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  findAll(
    @Query('categoryId') categoryId?: string,
    @Query('species') species?: string,
    @Query('status') status?: string,
    @Query('moderationStatus') moderationStatus?: string,
    @Query('name') name?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('minAgeMonths') minAgeMonths?: string,
    @Query('maxAgeMonths') maxAgeMonths?: string,
    @Query('sortBy') sortBy?: string,
    @Query('order') order?: 'ASC' | 'DESC',
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.animalsService.findAll({
      categoryId,
      species,
      status,
      moderationStatus,
      name,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      minAgeMonths: minAgeMonths ? Number(minAgeMonths) : undefined,
      maxAgeMonths: maxAgeMonths ? Number(maxAgeMonths) : undefined,
      sortBy,
      order,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get('species')
  listSpecies() {
    return this.animalsService.listSpecies();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.animalsService.findById(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateAnimalDto, @Request() req: { user: { userId: string } }) {
    return this.animalsService.create(dto, req.user.userId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateAnimalDto,
    @Request() req: { user: { userId: string; role: string } },
  ) {
    return this.animalsService.update(id, dto, req.user.userId, req.user.role);
  }

  // --- Модерация (только модератор/админ) ---
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'moderator')
  @Patch(':id/approve')
  approve(@Param('id') id: string) {
    return this.animalsService.approve(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'moderator')
  @Patch(':id/reject')
  reject(@Param('id') id: string, @Body() dto: RejectAnimalDto) {
    return this.animalsService.reject(id, dto.reason);
  }

  // Повторная отправка отклонённой карточки на проверку (владелец-продавец или админ).
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch(':id/resubmit')
  resubmit(@Param('id') id: string, @Request() req: { user: { userId: string; role: string } }) {
    return this.animalsService.resubmit(id, req.user.userId, req.user.role);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req: { user: User }) {
    await this.animalsService.remove(id, req.user);
    return { status: 'ok' };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post(':id/images')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: uploadDir,
        filename: (_req: Express.Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
          const ext = file.originalname.split('.').pop() || 'bin';
          cb(null, `${randomUUID()}.${ext}`);
        },
      }),
    }),
  )
  uploadImage(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Request() req: { user: { userId: string; role: string } },
  ) {
    const url = `/uploads/${file.filename}`;
    return this.animalsService.addImage(id, url, req.user.userId, req.user.role);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete(':id/images/:imageId')
  removeImage(
    @Param('id') id: string,
    @Param('imageId') imageId: string,
    @Request() req: { user: { userId: string; role: string } },
  ) {
    return this.animalsService.removeImage(id, imageId, req.user.userId, req.user.role);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch(':id/images/:imageId/cover')
  setCover(
    @Param('id') id: string,
    @Param('imageId') imageId: string,
    @Request() req: { user: { userId: string; role: string } },
  ) {
    return this.animalsService.setCover(id, imageId, req.user.userId, req.user.role);
  }
}
