import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Review } from './review.enitity';
import { Vinyl } from 'src/vinyls/vinyl.entity';
import { User } from 'src/users/user.entity';
import { ReviewQueryDto } from './dtos/review-query.dto';
import { ReviewResponseDto } from './dtos/review-response.dto';
import { InjectDataSource } from '@nestjs/typeorm';

@Injectable()
export class ReviewsRepository {
    private repo: Repository<Review>;

    constructor(@InjectDataSource() private dataSource: DataSource) {
        this.repo = this.dataSource.getRepository(Review);
    }

    public async findOne(
        userId: string,
        vinylId: string
    ): Promise<Review | null> {
        return this.repo.findOne({
            where: { user: { id: userId }, vinyl: { id: vinylId } },
            relations: ['user', 'vinyl'],
        });
    }

    public async findOneById(reviewId: string): Promise<Review | null> {
        return this.repo.findOne({
            where: { id: reviewId },
            relations: ['user', 'vinyl'],
        });
    }

    public async find(
        vinylId: string,
        query: ReviewQueryDto
    ): Promise<{
        reviews: ReviewResponseDto[];
        total: number;
        page: number;
        limit: number;
        lastPage: number;
    }> {
        const page = query.page || 1;
        const limit = query.limit || 10;
        const sortOrder = query.sortOrder || 'DESC';

        const [reviews, total] = await this.repo.findAndCount({
            where: { vinyl: { id: vinylId } },
            relations: ['user', 'vinyl'],
            order: { createdAt: sortOrder },
            skip: (page - 1) * limit,
            take: limit,
        });

        return {
            reviews,
            total,
            page,
            limit,
            lastPage: Math.ceil(total / limit),
        };
    }

    public async findByUser(userId: string): Promise<Review[]> {
        return this.repo.find({
            where: { user: { id: userId } },
            relations: ['user', 'vinyl'],
            order: { createdAt: 'DESC' },
        });
    }

    public async create(review: Partial<Review>): Promise<Review> {
        const newReview = this.repo.create({
            ...review,
            user: { id: review.user?.id } as User,
            vinyl: { id: review.vinyl?.id } as Vinyl,
        });
        return this.repo.save(newReview);
    }

    public async delete(reviewId: string): Promise<void> {
        await this.repo.delete({ id: reviewId });
    }
}
