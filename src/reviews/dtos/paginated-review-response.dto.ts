import { Expose, Type } from 'class-transformer';
import { ReviewResponseDto } from './review-response.dto';

export class PaginatedReviewsResponseDto {
    @Type(() => ReviewResponseDto)
    @Expose()
    reviews: ReviewResponseDto[];

    @Expose()
    total: number;

    @Expose()
    page: number;

    @Expose()
    limit: number;

    @Expose()
    lastPage: number;
}
