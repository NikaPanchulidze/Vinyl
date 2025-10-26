/* eslint-disable @typescript-eslint/no-floating-promises */
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { AppModule } from 'src/app.module';
import { User } from 'src/users/user.entity';
import { ConfigModule } from '@nestjs/config';
import { App } from 'supertest/types';

process.env.NODE_ENV = 'e2e';

describe('AuthController (E2E)', () => {
    let app: INestApplication<App>;
    let dataSource: DataSource;

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
        if (!dataSource.isInitialized) {
            await dataSource.initialize();
        }

        await dataSource.synchronize(true);
    });

    after(async () => {
        if (app) await app.close();
        if (dataSource?.isInitialized) await dataSource.destroy();
    });

    it('POST /auth/signup → should register a new user', async () => {
        const res = await request(app.getHttpServer())
            .post('/auth/signup')
            .send({
                email: 'testuser@example.com',
                password: 'Password123!',
                firstName: 'John',
                lastName: 'Doe',
                birthDate: '1990-01-01',
            })
            .expect(201);

        assert.strictEqual(res.body.email, 'testuser@example.com');
        assert.strictEqual(res.body.firstName, 'John');

        const userRepo = dataSource.getRepository(User);
        const user = await userRepo.findOneBy({
            email: 'testuser@example.com',
        });
        assert.ok(user, 'User should exist in DB');
    });

    it('POST /auth/signin → should login user and set jwt cookie', async () => {
        const res = await request(app.getHttpServer())
            .post('/auth/signin')
            .send({
                email: 'testuser@example.com',
                password: 'Password123!',
            })
            .expect(200);

        assert.ok(res.body.email, 'Response should contain user email');
        assert.ok(res.headers['set-cookie'], 'JWT cookie should be set');
    });

    it('POST /auth/signin → should fail on invalid credentials', async () => {
        const res = await request(app.getHttpServer())
            .post('/auth/signin')
            .send({
                email: 'testuser@example.com',
                password: 'wrongpassword',
            })
            .expect(401);

        assert.ok(
            res.body.message || res.text.includes('Unauthorized'),
            'Should return unauthorized message'
        );
    });

    it('GET /auth/logout → should clear jwt cookie', async () => {
        const loginRes = await request(app.getHttpServer())
            .post('/auth/signin')
            .send({
                email: 'testuser@example.com',
                password: 'Password123!',
            })
            .expect(200);

        const cookies = loginRes.headers['set-cookie'];
        assert.ok(cookies, 'Should have set-cookie header from signin');

        const logoutRes = await request(app.getHttpServer())
            .get('/auth/logout')
            .set('Cookie', cookies)
            .expect(200);

        const cleared = Array.isArray(logoutRes.headers['set-cookie'])
            ? logoutRes.headers['set-cookie'].some((c: string) =>
                  c.includes('jwt=;')
              )
            : false;
        assert.ok(cleared, 'JWT cookie should be cleared');
    });
});
