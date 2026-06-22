import { Controller, Get, Param, Patch, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  findAll(@Request() req: { user: { userId: string } }) {
    return this.notificationsService.findForUser(req.user.userId);
  }

  @Get('unread-count')
  unreadCount(@Request() req: { user: { userId: string } }) {
    return this.notificationsService.unreadCount(req.user.userId);
  }

  @Patch('read-all')
  markAllRead(@Request() req: { user: { userId: string } }) {
    return this.notificationsService.markAllRead(req.user.userId);
  }

  @Patch(':id/read')
  markRead(@Param('id') id: string, @Request() req: { user: { userId: string } }) {
    return this.notificationsService.markRead(id, req.user.userId);
  }
}
