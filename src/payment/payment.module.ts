import { forwardRef, Module } from '@nestjs/common';
import { OrdersModule } from 'src/orders/orders.module';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { EventBusModule } from 'src/eventBus/eventBus.module';

@Module({
    imports: [forwardRef(() => OrdersModule), EventBusModule],
    controllers: [PaymentController],
    providers: [PaymentService],
    exports: [PaymentService],
})
export class PaymentModule {}
