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
import { User } from 'src/users/user.entity';
import { Vinyl } from 'src/vinyls/vinyl.entity';
import { App } from 'supertest/types';
import { Review } from 'src/reviews/review.enitity';

process.env.NODE_ENV = 'e2e';

describe('AdminReviewsController (E2E)', () => {
    let app: INestApplication<App>;
    let dataSource: DataSource;
    let adminCookie: string[];
    let userCookie: string[];
    let vinyl: Vinyl;
    let review: Review;

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
                email: 'reviewuser@example.com',
                password: 'Password123!',
                firstName: 'Review',
                lastName: 'User',
            })
            .expect(201);

        const userLogin = await request(app.getHttpServer())
            .post('/auth/signin')
            .send({
                email: 'reviewuser@example.com',
                password: 'Password123!',
            })
            .expect(200);
        userCookie = [userLogin.headers['set-cookie']].flat();

        // Create an admin user
        await request(app.getHttpServer())
            .post('/auth/signup')
            .send({
                email: 'adminreview@example.com',
                password: 'AdminPass123!',
                firstName: 'Admin',
                lastName: 'Review',
            })
            .expect(201);

        const userRepo = dataSource.getRepository(User);
        const adminEntity = await userRepo.findOneBy({
            email: 'adminreview@example.com',
        });
        assert.ok(adminEntity, 'Admin user should exist');
        adminEntity.role = Role.ADMIN;
        await userRepo.save(adminEntity);

        const adminLogin = await request(app.getHttpServer())
            .post('/auth/signin')
            .send({
                email: 'adminreview@example.com',
                password: 'AdminPass123!',
            })
            .expect(200);
        adminCookie = [adminLogin.headers['set-cookie']].flat();

        // Create a vinyl to attach the review to
        const vinylRepo = dataSource.getRepository(Vinyl);
        vinyl = vinylRepo.create({
            name: 'Dark Side of the Moon',
            authorName: 'Pink Floyd',
            description: 'Classic progressive rock album.',
            priceCents: 3000,
        });
        await vinylRepo.save(vinyl);

        // Create a review
        const reviewRepo = dataSource.getRepository(Review);
        review = reviewRepo.create({
            vinyl,
            user: { id: 1 } as unknown as User,
            rating: 5,
            comment: 'Incredible sound quality!',
        });
        await reviewRepo.save(review);
    });

    after(async () => {
        if (app) await app.close();
        if (dataSource?.isInitialized) await dataSource.destroy();
    });

    it('DELETE /admin/reviews/:id → should allow ADMIN to delete a review', async () => {
        await request(app.getHttpServer())
            .delete(`/admin/reviews/${review.id}`)
            .set('Cookie', adminCookie)
            .expect(200);

        const reviewRepo = dataSource.getRepository(Review);
        const deleted = await reviewRepo.findOneBy({ id: review.id });
        assert.strictEqual(deleted, null, 'Review should be deleted from DB');
    });

    it('DELETE /admin/reviews/:id → should forbid normal USER', async () => {
        // Create another review to test this case
        const reviewRepo = dataSource.getRepository(Review);
        const anotherReview = reviewRepo.create({
            vinyl,
            user: { id: 1 } as unknown as User,
            rating: 4,
            comment: 'Still pretty good!',
        });
        await reviewRepo.save(anotherReview);

        await request(app.getHttpServer())
            .delete(`/admin/reviews/${anotherReview.id}`)
            .set('Cookie', userCookie)
            .expect(403);

        const existing = await reviewRepo.findOneBy({
            id: anotherReview.id,
        });
        assert.ok(existing, 'Review should not be deleted by normal user');
    });

    it('DELETE /admin/reviews/:id → should return 401 if not authenticated', async () => {
        // Create another review to test this
        const reviewRepo = dataSource.getRepository(Review);
        const thirdReview = reviewRepo.create({
            vinyl,
            user: { id: 1 } as unknown as User,
            rating: 3,
            comment: 'Decent but overrated',
        });
        await reviewRepo.save(thirdReview);

        await request(app.getHttpServer())
            .delete(`/admin/reviews/${thirdReview.id}`)
            .expect(401);

        const stillExists = await reviewRepo.findOneBy({
            id: thirdReview.id,
        });
        assert.ok(stillExists, 'Review should remain since no auth');
    });

    it('DELETE /admin/reviews/:id → should return 400 for invalid UUID', async () => {
        await request(app.getHttpServer())
            .delete('/admin/reviews/not-a-uuid')
            .set('Cookie', adminCookie)
            .expect(400);
    });

    it('DELETE /admin/reviews/:id → should return 404 for non-existent review', async () => {
        const fakeId = 'b6e0a61b-2ac3-4e3c-9c6c-3a25b6a8e7d1';
        await request(app.getHttpServer())
            .delete(`/admin/reviews/${fakeId}`)
            .set('Cookie', adminCookie)
            .expect(404);
    });
});
