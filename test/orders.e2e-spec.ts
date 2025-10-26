/* eslint-disable @typescript-eslint/no-floating-promises */
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { AppModule } from 'src/app.module';
import { User } from 'src/users/user.entity';
import { Vinyl } from 'src/vinyls/vinyl.entity';
import { Currency } from 'src/common/types/currency.enum';
import { Status } from 'src/orders/types/status.enum';
import { ConfigModule } from '@nestjs/config';
import { Order } from 'src/orders/order.enitity';
import { App } from 'supertest/types';

process.env.NODE_ENV = 'e2e';

describe('OrdersController (E2E)', () => {
    let app: INestApplication<App>;
    let dataSource: DataSource;
    let jwtCookie: string[];
    let vinyl: Vinyl;

    before(async () => {
        const moduleRef = await Test.createTestingModule({
            imports: [
                ConfigModule.forRoot({
                    isGlobal: true,
                    envFilePath: '.env.e2e',
                }),
                AppModule,
            ],
        }).compile();

        app = moduleRef.createNestApplication();
        await app.init();

        dataSource = app.get(DataSource);
        if (!dataSource.isInitialized) await dataSource.initialize();
        await dataSource.synchronize(true);

        // Create a test user
        await request(app.getHttpServer())
            .post('/auth/signup')
            .send({
                email: 'orderuser@example.com',
                password: 'Password123!',
                firstName: 'Order',
                lastName: 'User',
                birthDate: '1990-01-01',
            })
            .expect(201);

        const loginRes = await request(app.getHttpServer())
            .post('/auth/signin')
            .send({
                email: 'orderuser@example.com',
                password: 'Password123!',
            })
            .expect(200);

        jwtCookie = Array.isArray(loginRes.headers['set-cookie'])
            ? loginRes.headers['set-cookie']
            : [loginRes.headers['set-cookie']];
        assert.ok(jwtCookie, 'JWT cookie should be set');

        // Create one Vinyl to order
        const vinylRepo = dataSource.getRepository(Vinyl);
        vinyl = vinylRepo.create({
            name: 'Abbey Road',
            authorName: 'The Beatles',
            description: 'Classic 1969 album.',
            priceCents: 2500,
        });
        await vinylRepo.save(vinyl);

        // Seed one existing order
        const orderRepo = dataSource.getRepository(Order);
        await orderRepo.save({
            user: { id: 1 } as unknown as User,
            totalAmountCents: 2500,
            currency: Currency.USD,
            status: Status.PENDING,
            items: [],
        });
    });

    after(async () => {
        if (app) await app.close();
        if (dataSource?.isInitialized) await dataSource.destroy();
    });

    it('GET /orders/ → should return orders for current user', async () => {
        const res = await request(app.getHttpServer())
            .get('/orders/')
            .set('Cookie', jwtCookie)
            .expect(200);

        assert.ok(Array.isArray(res.body), 'Response should be array');
        assert.ok(res.body.length >= 1, 'User should have orders');
        assert.ok(
            res.body[0].totalAmountCents,
            'Order should have total amount'
        );
    });

    it('POST /orders/ → should create a new order and return Stripe URL', async () => {
        const newOrder = {
            items: [{ vinylId: vinyl.id, quantity: 2 }],
        };

        const res = await request(app.getHttpServer())
            .post('/orders/')
            .set('Cookie', jwtCookie)
            .send(newOrder)
            .expect(201);

        assert.ok(res.body.url, 'Response should include Stripe URL');

        const orderRepo = dataSource.getRepository(Order);
        const orders = await orderRepo.find();
        const created = orders.find(
            (o) => o.totalAmountCents === vinyl.priceCents * 2
        );
        assert.ok(created, 'Order should be created in DB');
    });

    it('GET /orders/ → should fail without JWT', async () => {
        await request(app.getHttpServer()).get('/orders/').expect(401);
    });

    it('POST /orders/ → should fail without JWT', async () => {
        const res = await request(app.getHttpServer())
            .post('/orders/')
            .send({ items: [{ vinylId: vinyl.id, quantity: 1 }] })
            .expect(401);

        assert.ok(res.text.includes('Unauthorized'));
    });
});
