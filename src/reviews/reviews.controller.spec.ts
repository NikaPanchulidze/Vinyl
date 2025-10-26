/* eslint-disable @typescript-eslint/no-floating-promises */
import { describe, it, beforeEach } from 'node:test';
import * as assert from 'node:assert';
import { randomUUID } from 'node:crypto';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';
import { User } from 'src/users/user.entity';
import { CreateReviewDto } from './dtos/create-review.dto';
import { Review } from './review.enitity';
import { PaginatedReviewsResponseDto } from './dtos/paginated-review-response.dto';
import { ReviewQueryDto } from './dtos/review-query.dto';

describe('ReviewsController', () => {
    let controller: ReviewsController;
    let fakeReviewsService: Partial<ReviewsService>;
    const reviews: Review[] = [];

    beforeEach(() => {
        reviews.length = 0;

        fakeReviewsService = {
            findByUser: (userId: string): Promise<Review[]> => {
                const userReviews = reviews.filter((r) => r.user.id === userId);
                return Promise.resolve(userReviews);
            },
            findByVinyl: (
                vinylId: string,
                query: ReviewQueryDto
            ): Promise<PaginatedReviewsResponseDto> => {
                const { page = 1, limit = 5 } = query;
                const vinylReviews = reviews.filter(
                    (r) => r.vinyl.id === vinylId
                );
                const start = (page - 1) * limit;
                const end = start + limit;
                const paginated = vinylReviews.slice(start, end);
                return Promise.resolve({
                    reviews: paginated,
                    total: vinylReviews.length,
                    page,
                    limit,
                    lastPage: Math.ceil(vinylReviews.length / limit),
                });
            },
            create: (
                user: User,
                vinylId: string,
                body: CreateReviewDto
            ): Promise<Review> => {
                const newReview: Review = {
                    id: randomUUID(),
                    user,
                    vinyl: { id: vinylId },
                    rating: body.rating,
                    comment: body.comment,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                } as Review;
                reviews.push(newReview);
                return Promise.resolve(newReview);
            },
            delete: (reviewId: string, user?: User): Promise<void> => {
                const index = reviews.findIndex((r) => r.id === reviewId);
                if (index === -1) throw new Error('NotFound');
                if (user && reviews[index].user.id !== user.id)
                    throw new Error('Forbidden');
                reviews.splice(index, 1);
                return Promise.resolve();
            },
        };

        controller = new ReviewsController(
            fakeReviewsService as ReviewsService
        );
    });

    it('should return only reviews of the current user', async () => {
        const user: User = {
            id: randomUUID(),
            email: 'test@example.com',
            firstName: 'John',
            lastName: 'Doe',
        } as User;

        reviews.push(
            {
                id: randomUUID(),
                user,
                vinyl: { id: 'v1' },
                rating: 4,
                comment: 'Nice!',
                createdAt: new Date(),
                updatedAt: new Date(),
            } as Review,
            {
                id: randomUUID(),
                user: { id: 'other-user' } as User,
                vinyl: { id: 'v2' },
                rating: 2,
                comment: 'Bad',
                createdAt: new Date(),
                updatedAt: new Date(),
            } as Review
        );

        const result = await controller.getMyReviews(user);

        assert.strictEqual(result.length, 1);
        assert.strictEqual(result[0].user.id, user.id);
        assert.strictEqual(result[0].comment, 'Nice!');
    });

    it('should return paginated reviews for given vinyl', async () => {
        const vinylId = randomUUID();

        for (let i = 0; i < 7; i++) {
            reviews.push({
                id: randomUUID(),
                user: { id: `u-${i}` } as User,
                vinyl: { id: vinylId },
                rating: 5,
                comment: `Review #${i + 1}`,
                createdAt: new Date(),
                updatedAt: new Date(),
            } as Review);
        }

        const query: ReviewQueryDto = { page: 2, limit: 3 } as ReviewQueryDto;
        const result = await controller.getAllReviewsByVinyl(vinylId, query);

        assert.strictEqual(result.reviews.length, 3);
        assert.strictEqual(result.page, 2);
        assert.strictEqual(result.limit, 3);
        assert.strictEqual(result.lastPage, 3);
        assert.strictEqual(result.reviews[0].comment, 'Review #4');
    });

    it('should create and return a new review', async () => {
        const vinylId = randomUUID();
        const user: User = {
            id: randomUUID(),
            email: 'test@example.com',
            firstName: 'John',
            lastName: 'Doe',
        } as User;
        const dto: CreateReviewDto = { rating: 5, comment: 'Excellent!' };

        const result = await controller.createReview(vinylId, user, dto);

        assert.ok(result.id);
        assert.strictEqual(result.vinyl.id, vinylId);
        assert.strictEqual(result.user.id, user.id);
        assert.strictEqual(result.comment, 'Excellent!');
        assert.strictEqual(reviews.length, 1);
    });

    it('should delete the review if user owns it', async () => {
        const user: User = {
            id: randomUUID(),
            email: 'test@example.com',
        } as User;
        const reviewId = randomUUID();

        reviews.push({
            id: reviewId,
            user,
            vinyl: { id: 'v-test' },
            rating: 4,
            comment: 'To delete',
            createdAt: new Date(),
            updatedAt: new Date(),
        } as Review);

        await controller.deleteReview(reviewId, user);

        assert.strictEqual(reviews.length, 0);
    });

    it('should throw if user tries to delete someone else review', async () => {
        const user: User = { id: 'user-1', email: 'user1@example.com' } as User;
        const otherUser: User = {
            id: 'other-user',
            email: 'other@example.com',
        } as User;
        const reviewId = randomUUID();

        reviews.push({
            id: reviewId,
            user: otherUser,
            vinyl: { id: 'v1' },
            rating: 3,
            comment: 'Unauthorized delete',
            createdAt: new Date(),
            updatedAt: new Date(),
        } as Review);

        let caught: Error | null = null;
        try {
            await controller.deleteReview(reviewId, user);
        } catch (err) {
            caught = err as Error;
        }

        assert.ok(caught);
        assert.strictEqual(caught.message, 'Forbidden');
        assert.strictEqual(reviews.length, 1);
    });
});
