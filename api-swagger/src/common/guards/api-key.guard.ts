import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../../users/users.service';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly usersService: UsersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'];
    if (!apiKey || typeof apiKey !== 'string') {
      throw new UnauthorizedException('Missing API key');
    }
    const user = await this.usersService.findByApiKey(apiKey);
    if (!user) {
      throw new UnauthorizedException('Invalid API key');
    }
    request.user = user;
    return true;
  }
}
