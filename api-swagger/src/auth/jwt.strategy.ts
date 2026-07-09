import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { UsersService } from '../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly usersService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET ?? 'change_me',
    });
  }

  async validate(payload: { sub: string; role: string }) {
    // Роль берём из БД, а не из payload: кабинет buyer↔seller переключается через
    // PATCH /auth/me без перевыпуска токена, и роль в JWT быстро устаревает
    // (ломала видимость чатов и создание support-диалогов).
    let role: string;
    try {
      role = (await this.usersService.findById(payload.sub)).role;
    } catch {
      throw new UnauthorizedException();
    }
    // id и userId — один и тот же идентификатор: userId читают auth/animals/notifications,
    // id — orders/animals(delete), где req.user используется как User (после отказа от x-api-key).
    return { id: payload.sub, userId: payload.sub, role };
  }
}
