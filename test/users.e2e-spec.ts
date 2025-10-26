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
import * as path from 'node:path';
import { App } from 'supertest/types';

process.env.NODE_ENV = 'e2e';

describe('UsersController (E2E)', () => {
    let app: INestApplication<App>;
    let dataSource: DataSource;
    let jwtCookie: string;

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

        const signupRes = await request(app.getHttpServer())
            .post('/auth/signup')
            .send({
                email: 'user1@example.com',
                password: 'Password123!',
                firstName: 'John',
                lastName: 'Doe',
                birthDate: '1990-01-01',
            })
            .expect(201);

        const loginRes = await request(app.getHttpServer())
            .post('/auth/signin')
            .send({
                email: 'user1@example.com',
                password: 'Password123!',
            })
            .expect(200);

        const cookies = loginRes.headers['set-cookie'] || [];
        jwtCookie = Array.isArray(cookies) ? cookies[0] : cookies;
        assert.ok(jwtCookie, 'JWT cookie should be set');
    });

    after(async () => {
        if (app) await app.close();
        if (dataSource?.isInitialized) await dataSource.destroy();
    });

    it('GET /users/me → should return current user profile', async () => {
        const res = await request(app.getHttpServer())
            .get('/users/me')
            .set('Cookie', jwtCookie)
            .expect(200);

        assert.strictEqual(res.body.email, 'user1@example.com');
        assert.strictEqual(res.body.firstName, 'John');
    });

    it('PATCH /users → should update current user profile', async () => {
        const res = await request(app.getHttpServer())
            .patch('/users')
            .set('Cookie', jwtCookie)
            .send({ firstName: 'Jane', lastName: 'Smith' })
            .expect(200);

        assert.strictEqual(res.body.firstName, 'Jane');
        assert.strictEqual(res.body.lastName, 'Smith');

        const userRepo = dataSource.getRepository(User);
        const user = await userRepo.findOneBy({ email: 'user1@example.com' });
        assert.strictEqual(user!.firstName, 'Jane');
        assert.strictEqual(user!.lastName, 'Smith');
    });

    it('POST /users/me/avatar → should upload avatar', async () => {
        const avatarPath = path.join(__dirname, 'test-avatar.png');
        const res = await request(app.getHttpServer())
            .post('/users/me/avatar')
            .set('Cookie', jwtCookie)
            .attach('avatar', avatarPath)
            .expect(201);

        assert.ok(res.body.avatarUrl, 'Response should contain avatar URL');
    });

    it('DELETE /users → should delete current user account and clear jwt cookie', async () => {
        const res = await request(app.getHttpServer())
            .delete('/users')
            .set('Cookie', jwtCookie)
            .expect(200);

        const cookies = res.headers['set-cookie'] || [];
        const cleared = (Array.isArray(cookies) ? cookies : [cookies]).some(
            (c: string) => c.includes('jwt=;')
        );
        assert.ok(cleared, 'JWT cookie should be cleared');

        const userRepo = dataSource.getRepository(User);
        const user = await userRepo.findOneBy({ email: 'user1@example.com' });
        assert.strictEqual(user, null);
    });
});
