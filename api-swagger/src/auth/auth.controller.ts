import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Put,
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

import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateFavoritesDto } from './dto/update-favorites.dto';
import { UpdateCartDto } from './dto/update-cart.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

const uploadDir = process.env.UPLOAD_DIR ?? 'uploads';
mkdirSync(uploadDir, { recursive: true });

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Request() req: { user: { userId: string; role: string } }) {
    return this.authService.getProfile(req.user.userId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch('me')
  updateMe(
    @Body() dto: UpdateProfileDto,
    @Request() req: { user: { userId: string; role: string } },
  ) {
    return this.authService.updateProfile(req.user.userId, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  changePassword(
    @Body() dto: ChangePasswordDto,
    @Request() req: { user: { userId: string; role: string } },
  ) {
    return this.authService.changePassword(req.user.userId, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Put('me/favorites')
  setFavorites(
    @Body() dto: UpdateFavoritesDto,
    @Request() req: { user: { userId: string; role: string } },
  ) {
    return this.authService.setFavorites(req.user.userId, dto.favorites);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Put('me/cart')
  setCart(@Body() dto: UpdateCartDto, @Request() req: { user: { userId: string; role: string } }) {
    return this.authService.setCart(req.user.userId, dto.cart);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('me/avatar')
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
  uploadAvatar(
    @UploadedFile() file: Express.Multer.File,
    @Request() req: { user: { userId: string } },
  ) {
    const url = `/uploads/${file.filename}`;
    return this.authService.setAvatar(req.user.userId, url);
  }
}
