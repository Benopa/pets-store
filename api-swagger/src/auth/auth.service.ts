import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

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
      apiKey: user.apiKey,
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
    const user = await this.usersService.findByEmail(email);
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
      apiKey: user.apiKey,
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
    const user = await this.usersService.findById(userId);
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
