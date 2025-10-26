import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { OrdersService } from 'src/orders/orders.service';
import { VinylsService } from 'src/vinyls/vinyls.service';
import { CreateReviewDto } from './dtos/create-review.dto';
import { ReviewsRepository } from './reviews.repository';
import { User } from 'src/users/user.entity';
import { Review } from './review.enitity';
import { ReviewQueryDto } from './dtos/review-query.dto';
import { ReviewResponseDto } from './dtos/review-response.dto';

@Injectable()
export class ReviewsService {
    constructor(
        private readonly reviewsRepo: ReviewsRepository,
        private readonly vinylsService: VinylsService,
        private readonly ordersService: OrdersService
    ) {}

    public async create(
        user: User,
        vinylId: string,
        body: CreateReviewDto
    ): Promise<Review> {
        const vinyl = await this.vinylsService.findById(vinylId);

        if (!vinyl) throw new NotFoundException('Vinyl not found');

        const purchased = await this.ordersService.hasPurchasedVinyl(
            user.id,
            vinylId
        );
        if (!purchased)
            throw new ForbiddenException(
                'You can only review purchased vinyls'
            );

        const existing = await this.reviewsRepo.findOne(user.id, vinylId);
        if (existing)
            throw new BadRequestException('You already reviewed this vinyl');

        return this.reviewsRepo.create({ ...body, user, vinyl });
    }

    public async findByVinyl(
        vinylId: string,
        query: ReviewQueryDto
    ): Promise<{
        reviews: ReviewResponseDto[];
        total: number;
        page: number;
        limit: number;
        lastPage: number;
    }> {
        const vinyl = await this.vinylsService.findById(vinylId);

        if (!vinyl) throw new NotFoundException('Vinyl not found');
        return this.reviewsRepo.find(vinylId, query);
    }

    public async findByUser(userId: string): Promise<Review[]> {
        return this.reviewsRepo.findByUser(userId);
    }

    public async delete(reviewId: string, user?: User): Promise<void> {
        const review = await this.reviewsRepo.findOneById(reviewId);
        if (!review) throw new NotFoundException('Review not found');

        if (user && review.user.id !== user.id)
            throw new ForbiddenException(
                'You can only delete your own reviews'
            );

        await this.reviewsRepo.delete(reviewId);
    }
}
