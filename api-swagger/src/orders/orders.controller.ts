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

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req: { user: { id: string } }) {
    return this.ordersService.findById(id, req.user as User);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateOrderDto, @Request() req: { user: { id: string } }) {
    return this.ordersService.update(id, dto, req.user as User);
  }
}
