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
import { Vinyl } from 'src/vinyls/vinyl.entity';
import path from 'path';
import fs from 'fs';
import { App } from 'supertest/types';

process.env.NODE_ENV = 'e2e';

describe('AdminVinylsController (E2E)', () => {
    let app: INestApplication<App>;
    let dataSource: DataSource;
    let adminCookie: string[];
    let userCookie: string[];
    let createdVinyl: Vinyl;

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
                email: 'normaluser@example.com',
                password: 'Password123!',
                firstName: 'Normal',
                lastName: 'User',
            })
            .expect(201);

        const userLogin = await request(app.getHttpServer())
            .post('/auth/signin')
            .send({
                email: 'normaluser@example.com',
                password: 'Password123!',
            })
            .expect(200);
        userCookie = [userLogin.headers['set-cookie']].flat();

        // Create an admin user
        const adminSignup = await request(app.getHttpServer())
            .post('/auth/signup')
            .send({
                email: 'admin@example.com',
                password: 'AdminPass123!',
                firstName: 'Admin',
                lastName: 'User',
            })
            .expect(201);

        // Manually promote to ADMIN
        const userRepo = dataSource.getRepository('User');
        const adminEntity = await userRepo.findOneBy({
            email: 'admin@example.com',
        });
        if (adminEntity) {
            adminEntity.role = Role.ADMIN;
            await userRepo.save(adminEntity);
        }

        const adminLogin = await request(app.getHttpServer())
            .post('/auth/signin')
            .send({
                email: 'admin@example.com',
                password: 'AdminPass123!',
            })
            .expect(200);
        adminCookie = [adminLogin.headers['set-cookie']].flat();
    });

    after(async () => {
        if (app) await app.close();
        if (dataSource?.isInitialized) await dataSource.destroy();
    });

    it('POST /admin/vinyls → should allow ADMIN to create a new vinyl', async () => {
        const res = await request(app.getHttpServer())
            .post('/admin/vinyls')
            .set('Cookie', adminCookie)
            .send({
                name: 'Abbey Road',
                authorName: 'The Beatles',
                description: 'Classic album released in 1969.',
                priceCents: 2900,
            })
            .expect(201);

        assert.ok(res.body.id, 'Vinyl should have an id');
        assert.strictEqual(res.body.name, 'Abbey Road');
        createdVinyl = res.body;
    });

    it('POST /admin/vinyls → should forbid normal USER from creating vinyl', async () => {
        await request(app.getHttpServer())
            .post('/admin/vinyls')
            .set('Cookie', userCookie)
            .send({
                name: 'Thriller',
                authorName: 'Michael Jackson',
                description: '1982 legendary album.',
                priceCents: 2500,
            })
            .expect(403);
    });

    it('PATCH /admin/vinyls/:id → should update vinyl details (ADMIN only)', async () => {
        const res = await request(app.getHttpServer())
            .patch(`/admin/vinyls/${createdVinyl.id}`)
            .set('Cookie', adminCookie)
            .send({
                priceCents: 3100,
                description: 'Remastered version of the 1969 classic album.',
            })
            .expect(200);

        assert.strictEqual(res.body.priceCents, 3100);
        assert.ok(res.body.description.includes('Remastered'));
    });

    it('PATCH /admin/vinyls/:id → should forbid USER from updating vinyl', async () => {
        await request(app.getHttpServer())
            .patch(`/admin/vinyls/${createdVinyl.id}`)
            .set('Cookie', userCookie)
            .send({ priceCents: 9999 })
            .expect(403);
    });

    it('POST /admin/vinyls/:id/image → should upload image (ADMIN only)', async () => {
        // Create a dummy image file
        const imagePath = path.join(__dirname, 'test-image.png');
        fs.writeFileSync(imagePath, Buffer.from([137, 80, 78, 71]));

        const res = await request(app.getHttpServer())
            .post(`/admin/vinyls/${createdVinyl.id}/image`)
            .set('Cookie', adminCookie)
            .attach('image', imagePath)
            .expect(201);

        assert.ok(res.body.imageUrl, 'Response should include imageUrl');
        fs.unlinkSync(imagePath);
    });

    it('DELETE /admin/vinyls/:id → should delete vinyl (ADMIN only)', async () => {
        await request(app.getHttpServer())
            .delete(`/admin/vinyls/${createdVinyl.id}`)
            .set('Cookie', adminCookie)
            .expect(200);

        const vinylRepo = dataSource.getRepository(Vinyl);
        const deleted = await vinylRepo.findOneBy({ id: createdVinyl.id });
        assert.strictEqual(deleted, null, 'Vinyl should be deleted from DB');
    });

    it('DELETE /admin/vinyls/:id → should forbid USER from deleting vinyl', async () => {
        const newVinyl = await dataSource.getRepository(Vinyl).save({
            name: 'Test Vinyl',
            authorName: 'Pink Floyd',
            description: 'Temp album.',
            priceCents: 1999,
        });

        await request(app.getHttpServer())
            .delete(`/admin/vinyls/${newVinyl.id}`)
            .set('Cookie', userCookie)
            .expect(403);
    });
});
