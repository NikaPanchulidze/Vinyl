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
import { SystemLog } from 'src/system-logs/system-log.entity';
import { App } from 'supertest/types';

process.env.NODE_ENV = 'e2e';

describe('AdminLogsController (E2E)', () => {
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
                email: 'user@example.com',
                password: 'Password123!',
                firstName: 'User',
                lastName: 'Test',
            })
            .expect(201);

        const userLogin = await request(app.getHttpServer())
            .post('/auth/signin')
            .send({
                email: 'user@example.com',
                password: 'Password123!',
            })
            .expect(200);
        userCookie = [userLogin.headers['set-cookie']].flat();

        // Create an admin user
        await request(app.getHttpServer())
            .post('/auth/signup')
            .send({
                email: 'admin@example.com',
                password: 'AdminPass123!',
                firstName: 'Admin',
                lastName: 'User',
            })
            .expect(201);

        // Promote admin to ADMIN role
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

        // Seed sample logs
        if (adminEntity) {
            const logsRepo = dataSource.getRepository(SystemLog);
            await logsRepo.save([
                {
                    userId: adminEntity.id,
                    entity: 'Vinyl',
                    action: 'CREATE',
                    description: 'Created Abbey Road vinyl',
                    duration: 142,
                },
                {
                    userId: adminEntity.id,
                    entity: 'Order',
                    action: 'DELETE',
                    description: 'Deleted order with ID #1234',
                    duration: 75,
                },
            ]);
        }
    });

    after(async () => {
        if (app) await app.close();
        if (dataSource?.isInitialized) await dataSource.destroy();
    });

    it('GET /admin/logs → should allow ADMIN to retrieve all logs', async () => {
        const res = await request(app.getHttpServer())
            .get('/admin/logs')
            .set('Cookie', adminCookie)
            .expect(200);

        assert.ok(
            Array.isArray(res.body.logs),
            'Response should contain logs array'
        );
        assert.ok(res.body.logs.length >= 2, 'Should contain seeded logs');
        assert.ok(res.body.logs[0].entity, 'Each log should have an entity');
        assert.ok(res.body.logs[0].action, 'Each log should have an action');
    });

    it('GET /admin/logs → should support query filtering (e.g., entity=CREATE)', async () => {
        const res = await request(app.getHttpServer())
            .get('/admin/logs')
            .set('Cookie', adminCookie)
            .query({ entity: 'CREATE' })
            .expect(200);

        assert.ok(Array.isArray(res.body.logs));
        assert.ok(
            res.body.logs.every((log: SystemLog) => log.entity === 'CREATE'),
            'All logs should match the filtered entity'
        );
    });

    it('GET /admin/logs → should forbid normal USER', async () => {
        await request(app.getHttpServer())
            .get('/admin/logs')
            .set('Cookie', userCookie)
            .expect(403);
    });

    it('GET /admin/logs → should return 401 if not authenticated', async () => {
        await request(app.getHttpServer()).get('/admin/logs').expect(401);
    });
});
