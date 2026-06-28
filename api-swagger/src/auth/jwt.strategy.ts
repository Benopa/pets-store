import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET ?? 'change_me',
    });
  }

  async validate(payload: { sub: string; role: string }) {
    // id и userId — один и тот же идентификатор: userId читают auth/animals/notifications,
    // id — orders/animals(delete), где req.user используется как User (после отказа от x-api-key).
    return { id: payload.sub, userId: payload.sub, role: payload.role };
  }
}
