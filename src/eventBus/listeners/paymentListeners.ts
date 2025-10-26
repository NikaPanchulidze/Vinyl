import { Injectable, OnModuleInit } from '@nestjs/common';
import { EmailService } from 'src/email/email.service';
import { Order } from 'src/orders/order.enitity';
import { OrdersService } from 'src/orders/orders.service';
import { EventBusService } from '../eventBus.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PaymentUpdatedListener implements OnModuleInit {
    constructor(
        private readonly eventBus: EventBusService,
        private readonly ordersService: OrdersService,
        private readonly emailService: EmailService,
        private readonly configService: ConfigService
    ) {}

    onModuleInit() {
        this.eventBus.on('PaymentWebhookSuccess', (orderId: string): void => {
            void (async () => {
                const order = (await this.ordersService.findOne(
                    orderId
                )) as Order;

                const subject = 'Payment Updated';
                const text = `Hi ${order.user.firstName}, your payment has been successfully processed.`;
                const html = `<p>Hi <strong>${order.user.firstName}</strong>, your payment has been successfully processed.</p>`;

                if (
                    this.configService.get<string>('NODE_ENV') === 'test' ||
                    this.configService.get<string>('NODE_ENV') === 'e2e'
                )
                    return;

                void this.emailService.sendMail({
                    to: order.user.email,
                    subject,
                    text,
                    html,
                });
            })();
        });

        this.eventBus.on('PaymentWebhookFailure', (orderId: string): void => {
            void (async () => {
                const order = (await this.ordersService.findOne(
                    orderId
                )) as Order;

                const subject = 'Payment Failed';
                const text = `Hi ${order.user.firstName}, unfortunately, your payment could not be processed. Please try again.`;
                const html = `<p>Hi <strong>${order.user.firstName}</strong>, unfortunately, your payment could not be processed. Please try again.</p>`;

                if (
                    this.configService.get<string>('NODE_ENV') === 'test' ||
                    this.configService.get<string>('NODE_ENV') === 'e2e'
                )
                    return;

                void this.emailService.sendMail({
                    to: order.user.email,
                    subject,
                    text,
                    html,
                });
            })();
        });
    }
}
