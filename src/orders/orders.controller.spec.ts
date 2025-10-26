/* eslint-disable @typescript-eslint/no-floating-promises */
import * as assert from 'node:assert';
import { randomUUID } from 'node:crypto';
import { beforeEach, describe, it } from 'node:test';
import { User } from 'src/users/user.entity';
import { CreateOrderDto } from './dtos/create-order.dto';
import { Order } from './order.enitity';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { Status } from './types/status.enum';

describe('OrdersController', () => {
    let controller: OrdersController;
    let fakeOrdersService: Partial<OrdersService>;
    const orders: Order[] = [];

    beforeEach(() => {
        orders.length = 0;

        fakeOrdersService = {
            findByUser: (user: User): Promise<Order[]> => {
                const userOrders = orders.filter((o) => o.user.id === user.id);
                return Promise.resolve(userOrders);
            },
            create: (
                userId: string,
                body: CreateOrderDto
            ): Promise<{ url: string }> => {
                const totalAmountCents = (body.vinylIds?.length ?? 0) * 5000;

                const newOrder: Order = {
                    id: randomUUID(),
                    user: { id: userId } as User,
                    items: [],
                    totalAmountCents,
                    currency: 'USD',
                    status: Status.PENDING,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                } as unknown as Order;

                orders.push(newOrder);

                return Promise.resolve({
                    url: `https://checkout.stripe.com/pay/${newOrder.id}`,
                });
            },
        };

        controller = new OrdersController(fakeOrdersService as OrdersService);
    });

    it('should return all orders of the current user', async () => {
        const user: User = {
            id: randomUUID(),
            email: 'test@example.com',
            firstName: 'John',
            lastName: 'Doe',
        } as User;

        orders.push(
            {
                id: randomUUID(),
                user,
                status: Status.PAID,
                items: [{ vinyl: 'v1' }],
                totalAmountCents: 12000,
                currency: 'USD',
                createdAt: new Date(),
                updatedAt: new Date(),
            } as unknown as Order,
            {
                id: randomUUID(),
                user: { id: 'other-user' } as User,
                status: Status.PAID,
                items: [{ vinyl: 'v2' }],
                totalAmountCents: 9900,
                currency: 'USD',
                createdAt: new Date(),
                updatedAt: new Date(),
            } as unknown as Order
        );

        const result = await controller.getUserOrders(user);

        assert.strictEqual(result.length, 1);
        assert.strictEqual(result[0].totalAmountCents, 12000);
    });

    it('should create a new order and return Stripe checkout URL', async () => {
        const user: User = {
            id: randomUUID(),
            email: 'order@test.com',
        } as User;

        const dto: CreateOrderDto = {
            vinylIds: ['v1', 'v2'],
        };

        const result = await controller.createOrder(dto, user);

        assert.ok(result.url.startsWith('https://checkout.stripe.com/pay/'));
        assert.strictEqual(orders.length, 1);
        assert.strictEqual(orders[0].user.id, user.id);
        assert.strictEqual(orders[0].totalAmountCents, 10000);
        assert.strictEqual(orders[0].status, Status.PENDING);
    });

    it('should return empty array when user has no orders', async () => {
        const user: User = {
            id: randomUUID(),
            email: 'noorders@test.com',
        } as User;

        const result = await controller.getUserOrders(user);

        assert.deepStrictEqual(result, []);
    });

    it('should correctly handle multiple users creating orders', async () => {
        const user1: User = { id: 'u1' } as User;
        const user2: User = { id: 'u2' } as User;

        await controller.createOrder({ vinylIds: ['v1'] }, user1);
        await controller.createOrder({ vinylIds: ['v2', 'v3'] }, user2);
        await controller.createOrder({ vinylIds: ['v4', 'v5'] }, user1);

        const user1Orders = await controller.getUserOrders(user1);
        const user2Orders = await controller.getUserOrders(user2);

        assert.strictEqual(user1Orders.length, 2);
        assert.strictEqual(user2Orders.length, 1);

        assert.ok(user1Orders.some((o) => o.totalAmountCents === 5000));
        assert.ok(user1Orders.some((o) => o.totalAmountCents === 10000));
        assert.ok(user2Orders.some((o) => o.totalAmountCents === 10000));
    });

    it('should generate unique payment URLs for each order', async () => {
        const user: User = { id: 'u-test' } as User;

        const dto: CreateOrderDto = {
            vinylIds: ['v1', 'v2', 'v3', 'v4'],
        };

        const result1 = await controller.createOrder(dto, user);
        const result2 = await controller.createOrder(dto, user);

        assert.notStrictEqual(result1.url, result2.url);
        assert.strictEqual(orders.length, 2);
    });
});
