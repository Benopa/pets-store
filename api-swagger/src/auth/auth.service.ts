import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';

import { UsersService } from '../users/users.service';
import { CartItem, User } from '../entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  private issueTokens(user: User) {
    const payload = { sub: user.id, role: user.role };
    return {
      accessToken: this.jwtService.sign(payload),
      role: user.role,
    };
  }

  async register(dto: RegisterDto) {
    // Роль ограничена на уровне DTO значениями buyer/seller.
    const user = await this.usersService.create({
      email: dto.email,
      password: dto.password,
      firstName: dto.firstName,
      lastName: dto.lastName,
      birthDate: dto.birthDate,
      role: dto.role ?? 'buyer',
    });
    return this.issueTokens(user);
  }

  async validateUser(email: string, password: string): Promise<User> {
    const user = await this.usersService.findByEmailWithPassword(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return user;
  }

  async login(email: string, password: string) {
    const user = await this.validateUser(email, password);
    return this.issueTokens(user);
  }

  // Запрос восстановления пароля. Не раскрываем, существует ли email:
  // если пользователя нет — просто возвращаем resetUrl: null.
  // Dev-stub: письмо не отправляем, ссылку логируем и возвращаем в ответе.
  async forgotPassword(email: string): Promise<{ resetUrl: string | null }> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      return { resetUrl: null };
    }
    // Сырой токен уходит в ссылку, в БД кладём только его sha256-хеш.
    const token = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000); // ссылка живёт 1 час
    await this.usersService.setResetToken(user.id, tokenHash, expires);

    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173';
    const resetUrl = `${frontendUrl}/reset-password?token=${token}`;
    console.log(`[password-reset] ${email} → ${resetUrl}`);
    return { resetUrl };
  }

  async resetPassword(token: string, newPassword: string): Promise<{ status: string }> {
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const user = await this.usersService.findByResetTokenHash(tokenHash);
    if (!user || !user.resetTokenExpires || user.resetTokenExpires.getTime() < Date.now()) {
      throw new BadRequestException('Ссылка недействительна или устарела');
    }
    await this.usersService.update(user.id, { password: newPassword });
    await this.usersService.clearResetToken(user.id);
    return { status: 'ok' };
  }

  // Безопасное представление пользователя для личного кабинета (без passwordHash).
  private toProfile(user: User) {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName ?? null,
      lastName: user.lastName ?? null,
      birthDate: user.birthDate ?? null,
      address: user.address ?? null,
      paymentMethod: user.paymentMethod ?? null,
      avatar: user.avatar ?? null,
      favorites: user.favorites ?? [],
      cart: user.cart ?? [],
      role: user.role,
      createdAt: user.createdAt,
    };
  }

  async getProfile(userId: string) {
    const user = await this.usersService.findById(userId);
    return this.toProfile(user);
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    // Тип кабинета (роль) можно менять только в пределах buyer/seller.
    if (dto.role) {
      const current = await this.usersService.findById(userId);
      if (current.role !== 'buyer' && current.role !== 'seller') {
        throw new ForbiddenException('Сменить тип кабинета может только покупатель или продавец');
      }
    }
    const user = await this.usersService.update(userId, dto);
    return this.toProfile(user);
  }

  async setAvatar(userId: string, url: string) {
    const user = await this.usersService.update(userId, { avatar: url });
    return this.toProfile(user);
  }

  async setFavorites(userId: string, favorites: string[]) {
    const user = await this.usersService.setFavorites(userId, favorites);
    return { favorites: user.favorites };
  }

  async setCart(userId: string, cart: CartItem[]) {
    const user = await this.usersService.setCart(userId, cart);
    return { cart: user.cart };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.usersService.findByIdWithPassword(userId);
    const ok = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Текущий пароль неверен');
    }
    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException('Новый пароль совпадает со старым');
    }
    await this.usersService.update(userId, { password: dto.newPassword });
    return { status: 'ok' };
  }
}
