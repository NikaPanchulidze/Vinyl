/* eslint-disable @typescript-eslint/no-floating-promises */
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { ConfigModule } from '@nestjs/config';
import { AppModule } from 'src/app.module';
import { App } from 'supertest/types';

import { User } from 'src/users/user.entity';
import { Vinyl } from 'src/vinyls/vinyl.entity';
import { Review } from 'src/reviews/review.enitity';

process.env.NODE_ENV = 'e2e';

describe('ReviewsController (E2E)', () => {
    let app: INestApplication<App>;
    let dataSource: DataSource;
    let jwtCookie: string[];
    let vinyl: Vinyl;
    let createdReview: Review;

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

        // Create test user
        await request(app.getHttpServer())
            .post('/auth/signup')
            .send({
                email: 'reviewuser@example.com',
                password: 'Password123!',
                firstName: 'Review',
                lastName: 'User',
                birthDate: '1990-01-01',
            })
            .expect(201);

        // Login and store cookie
        const loginRes = await request(app.getHttpServer())
            .post('/auth/signin')
            .send({
                email: 'reviewuser@example.com',
                password: 'Password123!',
            })
            .expect(200);

        jwtCookie = Array.isArray(loginRes.headers['set-cookie'])
            ? loginRes.headers['set-cookie']
            : [loginRes.headers['set-cookie']];
        assert.ok(jwtCookie, 'JWT cookie must be set');

        // Create one Vinyl to review
        const vinylRepo = dataSource.getRepository(Vinyl);
        vinyl = vinylRepo.create({
            name: 'Abbey Road',
            authorName: 'The Beatles',
            description: 'Classic 1969 album.',
            priceCents: 2500,
        });
        await vinylRepo.save(vinyl);
    });

    after(async () => {
        if (app) await app.close();
        if (dataSource?.isInitialized) await dataSource.destroy();
    });

    it('POST /reviews/:vinylId → should create a review', async () => {
        const body = {
            rating: 5,
            comment: 'Absolutely brilliant album!',
        };

        const res = await request(app.getHttpServer())
            .post(`/reviews/${vinyl.id}`)
            .set('Cookie', jwtCookie)
            .send(body)
            .expect(201);

        assert.ok(res.body.id, 'Response should include review ID');
        assert.strictEqual(res.body.rating, 5);
        assert.strictEqual(res.body.comment, 'Absolutely brilliant album!');

        // Verify DB
        const reviewRepo = dataSource.getRepository(Review);
        const found = await reviewRepo.findOne({
            where: { id: res.body.id },
            relations: ['user', 'vinyl'],
        });
        assert.ok(found, 'Review should be persisted in DB');
        assert.strictEqual(found.vinyl.id, vinyl.id);

        createdReview = found;
    });

    it('GET /reviews/my-reviews → should return reviews of current user', async () => {
        const res = await request(app.getHttpServer())
            .get('/reviews/my-reviews')
            .set('Cookie', jwtCookie)
            .expect(200);

        assert.ok(Array.isArray(res.body), 'Response must be array');
        assert.strictEqual(res.body.length, 1);
        assert.strictEqual(res.body[0].comment, createdReview.comment);
    });

    it('GET /reviews/:vinylId → should list all reviews for a specific vinyl', async () => {
        const res = await request(app.getHttpServer())
            .get(`/reviews/${vinyl.id}?page=1&limit=10`)
            .set('Cookie', jwtCookie)
            .expect(200);

        assert.ok(res.body.reviews, 'Response should include reviews array');
        assert.ok(res.body.total >= 1, 'Total count should be >= 1');
        assert.strictEqual(res.body.reviews[0].id, createdReview.id);
    });

    it('DELETE /reviews/:reviewId → should delete the review', async () => {
        await request(app.getHttpServer())
            .delete(`/reviews/${createdReview.id}`)
            .set('Cookie', jwtCookie)
            .expect(200);

        const reviewRepo = dataSource.getRepository(Review);
        const deleted = await reviewRepo.findOne({
            where: { id: createdReview.id },
        });
        assert.strictEqual(deleted, null, 'Review should be deleted from DB');
    });

    it('GET /reviews/my-reviews → should return empty array after deletion', async () => {
        const res = await request(app.getHttpServer())
            .get('/reviews/my-reviews')
            .set('Cookie', jwtCookie)
            .expect(200);

        assert.deepStrictEqual(res.body, [], 'User should have no reviews now');
    });

    it('POST /reviews/:vinylId → should fail without JWT', async () => {
        const res = await request(app.getHttpServer())
            .post(`/reviews/${vinyl.id}`)
            .send({ rating: 4, comment: 'Unauthorized test' })
            .expect(401);

        assert.ok(res.text.includes('Unauthorized'));
    });
});
