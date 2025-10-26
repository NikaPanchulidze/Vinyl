/* eslint-disable @typescript-eslint/no-floating-promises */
import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import assert from 'node:assert';
import { after, before, describe, it } from 'node:test';
import { AppModule } from 'src/app.module';
import { Vinyl } from 'src/vinyls/vinyl.entity';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';

process.env.NODE_ENV = 'e2e';

describe('VinylsController (E2E)', () => {
    let app: INestApplication<App>;
    let dataSource: DataSource;
    let jwtCookie: string[];

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

        await request(app.getHttpServer())
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

        const cookieHeader = loginRes.headers['set-cookie'];
        jwtCookie = Array.isArray(cookieHeader) ? cookieHeader : [cookieHeader];
        assert.ok(jwtCookie, 'JWT cookie should be set');

        const vinylRepo = dataSource.getRepository(Vinyl);
        await vinylRepo.save([
            {
                name: 'Chobby',
                authorName: 'The Beatles',
                description: 'Classic album released in 1969.',
                priceCents: 29,
            },
            {
                name: 'Dark Side of the Moon',
                authorName: 'Pink Floyd',
                description: 'Iconic progressive rock album released in 1973.',
                priceCents: 30,
            },
            {
                name: 'Thriller',
                authorName: 'Michael Jackson',
                description: 'Best-selling pop album released in 1982.',
                priceCents: 20,
            },
        ]);
    });

    after(async () => {
        if (app) await app.close();
        if (dataSource?.isInitialized) await dataSource.destroy();
    });

    it('GET /vinyls → should return all vinyls (unauthenticated)', async () => {
        const res = await request(app.getHttpServer())
            .get('/vinyls')
            .expect(200);

        assert.ok(Array.isArray(res.body.vinyls), 'vinyls should be an array');
        assert.strictEqual(res.body.total, 3);
        assert.strictEqual(res.body.page, 1);
        assert.strictEqual(res.body.lastPage, 1);
    });

    it('GET /vinyls → should return all vinyls (authenticated)', async () => {
        const res = await request(app.getHttpServer())
            .get('/vinyls')
            .set('Cookie', jwtCookie)
            .expect(200);

        assert.ok(Array.isArray(res.body.vinyls), 'vinyls should be an array');
        assert.strictEqual(res.body.total, 3);
    });

    it('GET /vinyls with query params → should filter vinyls by authorName and price', async () => {
        const res = await request(app.getHttpServer())
            .get('/vinyls')
            .query({ search: 'The Beatles' })
            .expect(200);

        assert.strictEqual(res.body.vinyls.length, 1);
        assert.strictEqual(res.body.vinyls[0].name, 'Chobby');
        assert.strictEqual(res.body.vinyls[0].authorName, 'The Beatles');
    });
});
