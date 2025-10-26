/* eslint-disable @typescript-eslint/no-floating-promises */
import * as assert from 'node:assert';
import { beforeEach, describe, it } from 'node:test';
import { AdminReviewsController } from './admin-reviews.controller';
import { ReviewsService } from 'src/reviews/reviews.service';

class FakeReviewsService {
    public deletedId: string | null = null;
    async delete(id: string) {
        this.deletedId = id;
        return Promise.resolve();
    }
}

describe('AdminReviewsController', () => {
    let controller: AdminReviewsController;
    let fakeReviewsService: FakeReviewsService;

    beforeEach(() => {
        fakeReviewsService = new FakeReviewsService();
        controller = new AdminReviewsController(
            fakeReviewsService as unknown as ReviewsService
        );
    });

    it('should delete a review with valid UUID', async () => {
        const fakeId = '123e4567-e89b-12d3-a456-426614174000';
        await controller.deleteReview(fakeId);

        assert.strictEqual(fakeReviewsService.deletedId, fakeId);
    });

    it('should call deleteReview multiple times with different IDs', async () => {
        const ids = [
            '111e1111-e11b-11d1-a111-111111111111',
            '222e2222-e22b-22d2-a222-222222222222',
        ];

        for (const id of ids) {
            await controller.deleteReview(id);
        }

        assert.strictEqual(
            fakeReviewsService.deletedId,
            '222e2222-e22b-22d2-a222-222222222222'
        );
    });
});
