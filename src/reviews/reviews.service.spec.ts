/* eslint-disable @typescript-eslint/no-floating-promises */
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import assert from 'node:assert';
import { randomUUID } from 'node:crypto';
import { beforeEach, describe, it } from 'node:test';
import { OrdersService } from 'src/orders/orders.service';
import { User } from 'src/users/user.entity';
import { VinylsService } from 'src/vinyls/vinyls.service';
import { CreateReviewDto } from './dtos/create-review.dto';
import { ReviewQueryDto } from './dtos/review-query.dto';
import { Review } from './review.enitity';
import { ReviewsRepository } from './reviews.repository';
import { ReviewsService } from './reviews.service';

describe('ReviewsService', () => {
    let reviewsService: ReviewsService;
    const reviews: Review[] = [];
    let fakeReviewsRepo: Partial<ReviewsRepository>;
    let fakeVinylsService: Partial<VinylsService>;
    let fakeOrdersService: Partial<OrdersService>;

    beforeEach(() => {
        reviews.length = 0;

        fakeReviewsRepo = {
            create: (data: Partial<Review>) => {
                const review: Review = {
                    id: randomUUID(),
                    user: data.user!,
                    vinyl: data.vinyl!,
                    rating: data.rating ?? 5,
                    comment: data.comment ?? '',
                    createdAt: new Date(),
                } as Review;
                reviews.push(review);
                return Promise.resolve(review);
            },
            findOne: (userId: string, vinylId: string) =>
                Promise.resolve(
                    reviews.find(
                        (r) => r.user.id === userId && r.vinyl.id === vinylId
                    ) || null
                ),
            findOneById: (id: string) =>
                Promise.resolve(reviews.find((r) => r.id === id) || null),
            find: (vinylId: string, query: ReviewQueryDto) => {
                const { page = 1, limit = 10 } = query;
                const filtered = reviews.filter((r) => r.vinyl.id === vinylId);
                const start = (page - 1) * limit;
                const end = start + limit;
                return Promise.resolve({
                    reviews: filtered.slice(start, end),
                    total: filtered.length,
                    page,
                    limit,
                    lastPage: Math.ceil(filtered.length / limit),
                });
            },
            findByUser: (userId: string) =>
                Promise.resolve(reviews.filter((r) => r.user.id === userId)),
            delete: (id: string) => {
                const index = reviews.findIndex((r) => r.id === id);
                if (index !== -1) reviews.splice(index, 1);
                return Promise.resolve();
            },
        };

        fakeVinylsService = {
            findById: (id: string) => Promise.resolve({ id } as any),
        };

        fakeOrdersService = {
            hasPurchasedVinyl: (userId: string, vinylId: string) =>
                Promise.resolve(true),
        };

        reviewsService = new ReviewsService(
            fakeReviewsRepo as ReviewsRepository,
            fakeVinylsService as VinylsService,
            fakeOrdersService as OrdersService
        );
    });

    it('should create a review successfully', async () => {
        const user: User = { id: randomUUID(), email: 'a@b.com' } as User;
        const body: CreateReviewDto = { rating: 5, comment: 'Great vinyl!' };

        const review = await reviewsService.create(user, 'vinyl-1', body);

        assert.strictEqual(review.user.id, user.id);
        assert.strictEqual(review.vinyl.id, 'vinyl-1');
        assert.strictEqual(review.comment, 'Great vinyl!');
        assert.strictEqual(reviews.length, 1);
    });

    it('should throw ForbiddenException if vinyl not purchased', async () => {
        fakeOrdersService.hasPurchasedVinyl = () => Promise.resolve(false);
        const user: User = { id: randomUUID() } as User;
        const body: CreateReviewDto = { rating: 5, comment: 'Test' };

        let caught: Error | null = null;
        try {
            await reviewsService.create(user, 'vinyl-2', body);
        } catch (err) {
            caught = err as Error;
        }
        assert.ok(caught instanceof ForbiddenException);
    });

    it('should throw BadRequestException if review already exists', async () => {
        const user: User = { id: randomUUID() } as User;
        const body: CreateReviewDto = { rating: 5, comment: 'Test' };
        await reviewsService.create(user, 'vinyl-3', body);

        let caught: Error | null = null;
        try {
            await reviewsService.create(user, 'vinyl-3', body);
        } catch (err) {
            caught = err as Error;
        }
        assert.ok(caught instanceof BadRequestException);
    });

    it('should delete a review successfully', async () => {
        const user: User = { id: randomUUID() } as User;
        const review = await reviewsService.create(user, 'vinyl-4', {
            rating: 5,
            comment: '',
        });

        await reviewsService.delete(review.id, user);

        assert.strictEqual(reviews.length, 0);
    });

    // eslint-disable-next-line
    it("should throw ForbiddenException when deleting another user's review", async () => {
        const user1: User = { id: randomUUID() } as User;
        const user2: User = { id: randomUUID() } as User;
        const review = await reviewsService.create(user1, 'vinyl-5', {
            rating: 5,
            comment: '',
        });

        let caught: Error | null = null;
        try {
            await reviewsService.delete(review.id, user2);
        } catch (err) {
            caught = err as Error;
        }
        assert.ok(caught instanceof ForbiddenException);
    });

    it('should find reviews by user', async () => {
        const user: User = { id: randomUUID() } as User;
        await reviewsService.create(user, 'vinyl-6', {
            rating: 4,
            comment: 'Nice',
        });

        const userReviews = await reviewsService.findByUser(user.id);
        assert.strictEqual(userReviews.length, 1);
        assert.strictEqual(userReviews[0].user.id, user.id);
    });

    it('should paginate reviews by vinyl', async () => {
        const user: User = { id: randomUUID() } as User;
        for (let i = 0; i < 12; i++) {
            await reviewsService.create(
                { id: randomUUID() } as User,
                'vinyl-7',
                { rating: 5, comment: `Review #${i}` }
            );
        }

        const result = await reviewsService.findByVinyl('vinyl-7', {
            page: 2,
            limit: 5,
        });
        assert.strictEqual(result.reviews.length, 5);
        assert.strictEqual(result.total, 12);
        assert.strictEqual(result.page, 2);
        assert.strictEqual(result.lastPage, 3);
    });
});
