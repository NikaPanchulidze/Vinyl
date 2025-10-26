/* eslint-disable @typescript-eslint/no-floating-promises */
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from 'src/app.module';
import { ConfigModule } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { Role } from 'src/users/types/roles.enum';
import { App } from 'supertest/types';

process.env.NODE_ENV = 'e2e';

describe('AdminDiscogsController (E2E)', () => {
    let app: INestApplication<App>;
    let dataSource: DataSource;
    let adminCookie: string[];
    let userCookie: string[];

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

        // Create a regular user
        await request(app.getHttpServer())
            .post('/auth/signup')
            .send({
                email: 'userdiscogs@example.com',
                password: 'Password123!',
                firstName: 'User',
                lastName: 'Discogs',
            })
            .expect(201);

        const userLogin = await request(app.getHttpServer())
            .post('/auth/signin')
            .send({
                email: 'userdiscogs@example.com',
                password: 'Password123!',
            })
            .expect(200);
        userCookie = [userLogin.headers['set-cookie']].flat();

        // Create an admin user
        await request(app.getHttpServer())
            .post('/auth/signup')
            .send({
                email: 'admindiscogs@example.com',
                password: 'AdminPass123!',
                firstName: 'Admin',
                lastName: 'Discogs',
            })
            .expect(201);

        // Promote to ADMIN
        const userRepo = dataSource.getRepository('User');
        const adminEntity = await userRepo.findOneBy({
            email: 'admindiscogs@example.com',
        });
        if (adminEntity) {
            adminEntity.role = Role.ADMIN;
            await userRepo.save(adminEntity);
        }

        const adminLogin = await request(app.getHttpServer())
            .post('/auth/signin')
            .send({
                email: 'admindiscogs@example.com',
                password: 'AdminPass123!',
            })
            .expect(200);
        adminCookie = [adminLogin.headers['set-cookie']].flat();
    });

    after(async () => {
        if (app) await app.close();
        if (dataSource?.isInitialized) await dataSource.destroy();
    });

    it('GET /admin/discogs/search → should allow ADMIN to search vinyls', async () => {
        const res = await request(app.getHttpServer())
            .get('/admin/discogs/search')
            .set('Cookie', adminCookie)
            .query({ query: 'Abbey Road' })
            .expect(200);

        assert.ok(Array.isArray(res.body), 'Response should be an array');
        if (res.body.length > 0) {
            assert.ok(res.body[0].name, 'Vinyl should have a name');
            assert.ok(
                res.body[0].authorName,
                'Vinyl should have an authorName'
            );
        }
    });

    it('GET /admin/discogs/search → should forbid normal USER', async () => {
        await request(app.getHttpServer())
            .get('/admin/discogs/search')
            .set('Cookie', userCookie)
            .query({ query: 'Abbey Road' })
            .expect(403);
    });

    it('GET /admin/discogs/search → should return 401 if not authenticated', async () => {
        await request(app.getHttpServer())
            .get('/admin/discogs/search')
            .query({ query: 'Abbey Road' })
            .expect(401);
    });

    it('GET /admin/discogs/details → should allow ADMIN to fetch vinyl details', async () => {
        const discogsId = 123456; // Mock discogsId for testing
        const res = await request(app.getHttpServer())
            .get('/admin/discogs/details')
            .set('Cookie', adminCookie)
            .query({ id: discogsId })
            .expect(200);

        assert.ok(res.body.name, 'Vinyl should have a name');
        assert.ok(res.body.authorName, 'Vinyl should have an authorName');
    });

    it('GET /admin/discogs/details → should return 400 for invalid id', async () => {
        await request(app.getHttpServer())
            .get('/admin/discogs/details')
            .set('Cookie', adminCookie)
            .query({ id: 'invalid' })
            .expect(400);
    });

    it('POST /admin/discogs/add-vinyl → should allow ADMIN to add vinyl', async () => {
        const res = await request(app.getHttpServer())
            .post('/admin/discogs/add-vinyl')
            .set('Cookie', adminCookie)
            .send({ discogsId: 123456, priceCents: 3000 })
            .expect(201);

        assert.ok(res.body.name, 'Vinyl should have a name');
        assert.ok(res.body.priceCents === 3000, 'Price should match');
    });

    it('POST /admin/discogs/add-vinyl → should forbid normal USER', async () => {
        await request(app.getHttpServer())
            .post('/admin/discogs/add-vinyl')
            .set('Cookie', userCookie)
            .send({ discogsId: 123456, priceCents: 3000 })
            .expect(403);
    });

    it('POST /admin/discogs/add-vinyl → should return 401 if not authenticated', async () => {
        await request(app.getHttpServer())
            .post('/admin/discogs/add-vinyl')
            .send({ discogsId: 123456, priceCents: 3000 })
            .expect(401);
    });
});
