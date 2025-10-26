import {
    Injectable,
    BadRequestException,
    Inject,
    forwardRef,
    RawBodyRequest,
} from '@nestjs/common';
import Stripe from 'stripe';
import { OrdersService } from '../orders/orders.service';
import { ConfigService } from '@nestjs/config';
import { Order } from 'src/orders/order.enitity';
import { Status } from 'src/orders/types/status.enum';
import { EventBusService } from 'src/eventBus/eventBus.service';

@Injectable()
export class PaymentService {
    private stripe: Stripe;

    constructor(
        @Inject(forwardRef(() => OrdersService))
        private readonly ordersService: OrdersService,
        private readonly configService: ConfigService,
        private readonly eventBus: EventBusService
    ) {
        const isTest =
            process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'e2e';

        const secret = isTest
            ? process.env.TEST_STRIPE_SECRET_KEY || 'test_secret'
            : this.configService.get<string>('STRIPE_SECRET_KEY');

        this.stripe = new Stripe(secret!, {
            apiVersion: '2025-09-30.clover',
        });
    }

    public async createCheckoutSession(
        order: Order
    ): Promise<{ url: string | null }> {
        if (order.status !== Status.PENDING)
            throw new BadRequestException('Order already paid or failed');

        const line_items = order.items.map((item) => ({
            price_data: {
                currency: order.currency,
                product_data: {
                    name: item.vinyl.name,
                },
                unit_amount: item.priceCents,
            },
            quantity: 1,
        }));

        const session = await this.stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'payment',
            line_items,
            metadata: { orderId: order.id },
            success_url: 'http://localhost:3000/orders',
            cancel_url: 'http://localhost:3000/orders',
        });

        await this.ordersService.updateSessionId(
            order.id,
            String(session.id),
            order.user.id
        );

        return { url: session.url };
    }

    public async handleWebhook(
        signature: string,
        req: RawBodyRequest<Request>
    ): Promise<{ received: boolean }> {
        const webhookSecret = this.configService.get<string>(
            'STRIPE_WEBHOOK_SECRET'
        );

        const rawBody = req.rawBody;

        if (!rawBody) {
            throw new BadRequestException('Raw body is missing');
        }

        let event: Stripe.Event;
        try {
            event = this.stripe.webhooks.constructEvent(
                rawBody,
                signature,
                String(webhookSecret)
            );
        } catch (err) {
            throw new BadRequestException(
                `Webhook Error: ${(err as Error).message}`
            );
        }

        switch (event.type) {
            case 'checkout.session.completed':
            case 'checkout.session.async_payment_succeeded': {
                const session = event.data.object;
                const orderId = session.metadata?.orderId;
                if (!orderId || typeof orderId !== 'string') {
                    throw new BadRequestException(
                        'Order ID missing in session metadata'
                    );
                }
                await this.ordersService.markAsPaid(orderId);
                this.eventBus.emit('PaymentWebhookSuccess', orderId);
                break;
            }

            case 'payment_intent.payment_failed':
            case 'checkout.session.async_payment_failed':
            case 'checkout.session.expired': {
                const paymentIntent = event.data.object;
                const failedOrderId = paymentIntent.metadata?.orderId;
                if (!failedOrderId || typeof failedOrderId !== 'string') {
                    throw new BadRequestException(
                        'Order ID missing in payment intent metadata'
                    );
                }
                await this.ordersService.markAsFailed(failedOrderId);
                this.eventBus.emit('PaymentWebhookFailure', failedOrderId);
                break;
            }

            default:
                console.log(`Unhandled event type ${event.type}`);
        }

        return { received: true };
    }
}
