/* eslint-disable @typescript-eslint/no-floating-promises */
import assert from 'node:assert';
import { beforeEach, describe, it } from 'node:test';
import { Status } from '../orders/types/status.enum';
import { PaymentService } from './payment.service'; // adjust path if needed
import { Order } from 'src/orders/order.enitity';
import { OrdersService } from 'src/orders/orders.service';
import { ConfigService } from '@nestjs/config';
import { EventBusService } from 'src/eventBus/eventBus.service';

describe('PaymentService', () => {
    let svc: PaymentService;

    // simple stubs
    const ordersStub: any = {
        updateSessionIdCalledWith: null,
        markAsPaidCalledWith: null,
        markAsFailedCalledWith: null,
        updateSessionId: (
            orderId: string,
            sessionId: string,
            userId: string
        ) => {
            ordersStub.updateSessionIdCalledWith = {
                orderId,
                sessionId,
                userId,
            };
            return Promise.resolve(true);
        },
        markAsPaid: (orderId: string) => {
            ordersStub.markAsPaidCalledWith = orderId;
            return Promise.resolve();
        },
        markAsFailed: (orderId: string) => {
            ordersStub.markAsFailedCalledWith = orderId;
            return Promise.resolve();
        },
    };

    const eventBusStub: any = {
        emitted: [] as Array<{ event: string; data: string }>,
        emit: (e: string, d: string) => {
            eventBusStub.emitted.push({ event: e, data: d });
        },
    };

    const configStub: any = {
        get: (k: string) => {
            if (k === 'STRIPE_SECRET_KEY') return 'sk_test_123';
            if (k === 'STRIPE_WEBHOOK_SECRET') return 'whsec_test';
            return undefined;
        },
    };

    const stripeMock: any = {
        checkout: {
            sessions: {
                create: () =>
                    Promise.resolve({
                        id: 'cs_test_1',
                        url: 'https://checkout.test/cs_test_1',
                    }),
            },
        },
        webhooks: {
            constructEvent: (rawBody: any) => {
                if (rawBody === 'bad') throw new Error('invalid payload');
                if (rawBody === 'success') {
                    return {
                        type: 'checkout.session.completed',
                        data: { object: { metadata: { orderId: 'order-1' } } },
                    };
                }
                if (rawBody === 'fail') {
                    return {
                        type: 'payment_intent.payment_failed',
                        data: { object: { metadata: { orderId: 'order-2' } } },
                    };
                }
                if (rawBody === 'expired') {
                    return {
                        type: 'checkout.session.expired',
                        data: { object: { metadata: { orderId: 'order-3' } } },
                    };
                }
                return { type: 'unknown', data: { object: {} } };
            },
        },
    };

    beforeEach(() => {
        ordersStub.updateSessionIdCalledWith = null;
        ordersStub.markAsPaidCalledWith = null;
        ordersStub.markAsFailedCalledWith = null;
        eventBusStub.emitted.length = 0;

        svc = new PaymentService(
            ordersStub as OrdersService,
            configStub as ConfigService,
            eventBusStub as EventBusService
        );
        (svc as any).stripe = stripeMock;
    });

    it('createCheckoutSession - success and updateSessionId called', async () => {
        const order = {
            id: 'order-1',
            status: Status.PENDING,
            items: [{ vinyl: { name: 'Some Vinyl' }, priceCents: 2000 }],
            currency: 'usd',
            user: { id: 'user-1' },
            totalAmountCents: 2000,
            createdAt: new Date(),
            updatedAt: new Date(),
        } as unknown as Order;

        const res = await svc.createCheckoutSession(order);
        assert.strictEqual(res.url, 'https://checkout.test/cs_test_1');
        assert.deepStrictEqual(ordersStub.updateSessionIdCalledWith, {
            orderId: 'order-1',
            sessionId: 'cs_test_1',
            userId: 'user-1',
        });
    });

    it('createCheckoutSession - rejects when not PENDING', async () => {
        const order = { status: Status.PAID } as unknown as Order;
        await assert.rejects(() => svc.createCheckoutSession(order));
    });

    it('handleWebhook - successful checkout.session.completed', async () => {
        const result = await svc.handleWebhook('sig', {
            rawBody: 'success',
        } as unknown as Request);
        assert.deepStrictEqual(result, { received: true });
        assert.strictEqual(ordersStub.markAsPaidCalledWith, 'order-1');
        assert.strictEqual(
            eventBusStub.emitted[0].event,
            'PaymentWebhookSuccess'
        );
        assert.strictEqual(eventBusStub.emitted[0].data, 'order-1');
    });

    it('handleWebhook - payment failed and expired handled as failed', async () => {
        await svc.handleWebhook('sig', {
            rawBody: 'fail',
        } as unknown as Request);
        assert.strictEqual(ordersStub.markAsFailedCalledWith, 'order-2');
        assert.strictEqual(
            eventBusStub.emitted[0].event,
            'PaymentWebhookFailure'
        );

        ordersStub.markAsFailedCalledWith = null;
        eventBusStub.emitted.length = 0;

        await svc.handleWebhook('sig', {
            rawBody: 'expired',
        } as unknown as Request);
        assert.strictEqual(ordersStub.markAsFailedCalledWith, 'order-3');
        assert.strictEqual(
            eventBusStub.emitted[0].event,
            'PaymentWebhookFailure'
        );
    });

    it('handleWebhook - throws when rawBody missing', async () => {
        await assert.rejects(() =>
            svc.handleWebhook('sig', { rawBody: null } as unknown as Request)
        );
    });
});
