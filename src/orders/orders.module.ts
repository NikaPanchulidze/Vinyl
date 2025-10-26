import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileModule } from 'src/file/file.module';
import { PaymentModule } from 'src/payment/payment.module';
import { VinylsModule } from 'src/vinyls/vinyls.module';
import { OrderItem } from './order-item.entity';
import { Order } from './order.enitity';
import { OrdersController } from './orders.controller';
import { OrdersRepository } from './orders.repository';
import { OrdersService } from './orders.service';
import { PaymentUpdatedListener } from 'src/eventBus/listeners/paymentListeners';
import { EventBusModule } from 'src/eventBus/eventBus.module';
import { EmailModule } from 'src/email/email.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Order, OrderItem]),
        VinylsModule,
        FileModule,
        EventBusModule,
        EmailModule,
        forwardRef(() => PaymentModule),
    ],
    controllers: [OrdersController],
    providers: [OrdersService, OrdersRepository, PaymentUpdatedListener],
    exports: [OrdersService, OrdersRepository],
})
export class OrdersModule {}
