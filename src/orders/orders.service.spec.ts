/* eslint-disable @typescript-eslint/no-floating-promises */
import * as assert from 'node:assert';
import { beforeEach, describe, it } from 'node:test';
import { PaymentService } from 'src/payment/payment.service';
import { User } from 'src/users/user.entity';
import { VinylsService } from 'src/vinyls/vinyls.service';
import { Order } from './order.enitity';
import { OrdersRepository } from './orders.repository';
import { OrdersService } from './orders.service';
import { Status } from './types/status.enum';
import { Vinyl } from 'src/vinyls/vinyl.entity';

type MockVinyl = {
    id: string;
    priceCents: number;
    currency: string;
};

describe('OrdersService', () => {
    let service: OrdersService;
    let fakeRepo: Partial<OrdersRepository>;
    let fakeVinyls: Partial<VinylsService>;
    let fakePayment: Partial<PaymentService>;

    const vinyls: MockVinyl[] = [
        { id: 'v1', priceCents: 1000, currency: 'USD' },
        { id: 'v2', priceCents: 2000, currency: 'USD' },
    ];

    const orders: Order[] = [];

    beforeEach(() => {
        orders.length = 0;

        fakeRepo = {
            create: async (orderData: Partial<Order>) => {
                const order: Order = {
                    id: 'o' + (orders.length + 1),
                    items: orderData.items || [],
                    totalAmountCents: orderData.totalAmountCents || 0,
                    currency: orderData.currency || 'USD',
                    status: orderData.status || Status.PENDING,
                    user: orderData.user as User,
                    stripeSessionId: orderData.stripeSessionId,
                } as Order;
                orders.push(order);
                return Promise.resolve(order);
            },
            findOneByUser: (orderId: string, userId: string) =>
                Promise.resolve(
                    orders.find(
                        (o) => o.id === orderId && o.user.id === userId
                    ) || null
                ),
            findOne: (orderId: string) =>
                Promise.resolve(orders.find((o) => o.id === orderId) || null),
            update: async (order: Order) => Promise.resolve(order),
            findByUser: async (user: User) =>
                Promise.resolve(orders.filter((o) => o.user.id === user.id)),
        };

        fakeVinyls = {
            findById: async (id: string) =>
                Promise.resolve(
                    (vinyls.find((v) => v.id === id) as Vinyl) || null
                ),
        };

        fakePayment = {
            createCheckoutSession: async (order: Order) =>
                Promise.resolve({
                    url: 'https://checkout.fake/' + order.id,
                }),
        };

        service = new OrdersService(
            fakeRepo as OrdersRepository,
            fakeVinyls as VinylsService,
            fakePayment as PaymentService
        );
    });

    it('should create an order and return checkout URL', async () => {
        const user: User = { id: 'u1' } as User;
        const result = await service.create(user.id, {
            vinylIds: ['v1', 'v2'],
        });
        assert.ok(result.url);
        assert.strictEqual(result.url, 'https://checkout.fake/o1');
        assert.strictEqual(orders[0].items.length, 2);
        assert.strictEqual(orders[0].totalAmountCents, 3000);
    });

    it('should throw NotFoundException if any vinyl not found', async () => {
        const user: User = { id: 'u1' } as User;
        let caught: unknown = null;
        try {
            await service.create(user.id, { vinylIds: ['v1', 'v3'] });
        } catch (err) {
            caught = err;
        }
        assert.ok(caught);
        assert.strictEqual(
            (caught as Error).constructor.name,
            'NotFoundException'
        );
    });

    it('should update session id', async () => {
        const user: User = { id: 'u1' } as User;
        await service.create(user.id, { vinylIds: ['v1'] });
        const updated = await service.updateSessionId('o1', 'sess123', user.id);
        assert.strictEqual(updated.stripeSessionId, 'sess123');
    });

    it('should throw NotFoundException on updateSessionId for missing order', async () => {
        let caught: unknown = null;
        try {
            await service.updateSessionId('non', 'sess', 'u1');
        } catch (err) {
            caught = err;
        }
        assert.ok(caught);
        assert.strictEqual(
            (caught as Error).constructor.name,
            'NotFoundException'
        );
    });

    it('should mark order as paid', async () => {
        const user: User = { id: 'u1' } as User;
        await service.create(user.id, { vinylIds: ['v1'] });
        const paid = await service.markAsPaid('o1');
        assert.strictEqual(paid.status, Status.PAID);
    });

    it('should mark order as failed', async () => {
        const user: User = { id: 'u1' } as User;
        await service.create(user.id, { vinylIds: ['v1'] });
        const failed = await service.markAsFailed('o1');
        assert.strictEqual(failed.status, Status.FAILED);
    });

    it('should find orders by user', async () => {
        const user: User = { id: 'u1' } as User;
        await service.create(user.id, { vinylIds: ['v1'] });
        const list = await service.findByUser(user);
        assert.strictEqual(list.length, 1);
        assert.strictEqual(list[0].user.id, 'u1');
    });

    it('should return true if user purchased vinyl', async () => {
        const user: User = { id: 'u1' } as User;
        await service.create(user.id, { vinylIds: ['v1'] });
        await service.markAsPaid('o1');
        const purchased = await service.hasPurchasedVinyl(user.id, 'v1');
        assert.strictEqual(purchased, true);
    });

    it('should return false if user did not purchase vinyl', async () => {
        const user: User = { id: 'u1' } as User;
        await service.create(user.id, { vinylIds: ['v1'] });
        const purchased = await service.hasPurchasedVinyl(user.id, 'v2');
        assert.strictEqual(purchased, false);
    });
});
