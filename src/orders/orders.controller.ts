import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { CreateOrderDto } from './dtos/create-order.dto';
import { CurrentUser } from 'src/users/decorators/current-user.decorator';
import { User } from 'src/users/user.entity';
import { Serialize } from 'src/interceptors/serialize.interceptor';
import { OrderResponseDto } from './dtos/order-resposne.dto';
import { ApiOperation } from '@nestjs/swagger';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
    constructor(private readonly ordersService: OrdersService) {}

    @Get('/')
    @Serialize(OrderResponseDto)
    @ApiOperation({ summary: 'Get orders of the current user' })
    public getUserOrders(
        @CurrentUser() user: User
    ): Promise<OrderResponseDto[]> {
        return this.ordersService.findByUser(user);
    }

    @Post('/')
    @ApiOperation({ summary: 'Create a new order' })
    public createOrder(
        @Body() Body: CreateOrderDto,
        @CurrentUser() user: User
    ): Promise<{ url: string }> {
        return this.ordersService.create(user.id, Body);
    }
}
