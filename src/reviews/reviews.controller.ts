import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseUUIDPipe,
    Post,
    Query,
    UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { ReviewsService } from './reviews.service';
import { CurrentUser } from 'src/users/decorators/current-user.decorator';
import { User } from 'src/users/user.entity';
import { CreateReviewDto } from './dtos/create-review.dto';
import { ReviewResponseDto } from './dtos/review-response.dto';
import { Serialize } from 'src/interceptors/serialize.interceptor';
import { ReviewQueryDto } from './dtos/review-query.dto';
import { PaginatedReviewsResponseDto } from './dtos/paginated-review-response.dto';
import { ApiOperation } from '@nestjs/swagger';

@Controller('reviews')
@UseGuards(JwtAuthGuard)
export class ReviewsController {
    constructor(private readonly reviewsService: ReviewsService) {}

    @Get('/my-reviews')
    @Serialize(ReviewResponseDto)
    @ApiOperation({ summary: 'Get reviews of the current user' })
    public getMyReviews(
        @CurrentUser() user: User
    ): Promise<ReviewResponseDto[]> {
        return this.reviewsService.findByUser(user.id);
    }

    @Get('/:vinylId')
    @Serialize(PaginatedReviewsResponseDto)
    @ApiOperation({ summary: 'Get all reviews for a specific vinyl' })
    public getAllReviewsByVinyl(
        @Param('vinylId', new ParseUUIDPipe({ version: '4' })) vinylId: string,
        @Query() query: ReviewQueryDto
    ): Promise<PaginatedReviewsResponseDto> {
        return this.reviewsService.findByVinyl(vinylId, query);
    }

    @Post('/:vinylId')
    @Serialize(ReviewResponseDto)
    @ApiOperation({ summary: 'Create a review for a specific vinyl' })
    public createReview(
        @Param('vinylId', new ParseUUIDPipe({ version: '4' })) vinylId: string,
        @CurrentUser() user: User,
        @Body() body: CreateReviewDto
    ): Promise<ReviewResponseDto> {
        return this.reviewsService.create(user, vinylId, body);
    }

    @Delete('/:reviewId')
    @Serialize(ReviewResponseDto)
    @ApiOperation({ summary: 'Delete a review by its ID' })
    public async deleteReview(
        @Param('reviewId', new ParseUUIDPipe({ version: '4' }))
        reviewId: string,
        @CurrentUser() user: User
    ): Promise<void> {
        await this.reviewsService.delete(reviewId, user);
    }
}
