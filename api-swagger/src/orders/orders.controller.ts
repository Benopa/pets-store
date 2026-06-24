import { Body, Controller, Get, Param, Patch, Post, Request, UseGuards } from '@nestjs/common';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';

import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { ApiKeyGuard } from '../common/guards/api-key.guard';
import { User } from '../entities/user.entity';

@ApiTags('orders')
@ApiSecurity('apiKey')
@UseGuards(ApiKeyGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  create(@Body() dto: CreateOrderDto, @Request() req: { user: { id: string } }) {
    return this.ordersService.create(dto, req.user as User);
  }

  @Get()
  findAll(@Request() req: { user: { id: string } }) {
    return this.ordersService.findAll(req.user as User);
  }

  // История продаж: заказы других пользователей, содержащие товары текущего продавца.
  // Объявлено до ':id', иначе путь 'sales' будет принят за идентификатор заказа.
  @Get('sales')
  findSales(@Request() req: { user: { id: string } }) {
    return this.ordersService.findSales(req.user as User);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req: { user: { id: string } }) {
    return this.ordersService.findById(id, req.user as User);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateOrderDto, @Request() req: { user: { id: string } }) {
    return this.ordersService.update(id, dto, req.user as User);
  }

  // Отмена всего заказа (доступна, пока заказ не получен).
  @Patch(':id/cancel')
  cancel(@Param('id') id: string, @Request() req: { user: { id: string } }) {
    return this.ordersService.cancel(id, req.user as User);
  }

  // Отмена одной позиции заказа.
  @Patch(':id/items/:itemId/cancel')
  cancelItem(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Request() req: { user: { id: string } },
  ) {
    return this.ordersService.cancelItem(id, itemId, req.user as User);
  }

  // Подтверждение получения заказа покупателем.
  @Patch(':id/received')
  markReceived(@Param('id') id: string, @Request() req: { user: { id: string } }) {
    return this.ordersService.markReceived(id, req.user as User);
  }
}
