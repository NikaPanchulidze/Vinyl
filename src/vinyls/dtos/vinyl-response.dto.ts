import { Expose } from 'class-transformer';

export class VinylResponseDto {
    @Expose()
    id: string;

    @Expose()
    name: string;

    @Expose()
    authorName: string;

    @Expose()
    description: string;

    @Expose()
    imageUrl?: string;

    @Expose()
    priceCents: number;

    @Expose()
    currency: string;

    @Expose()
    discogsId?: number;

    @Expose()
    discogsScore?: number;

    @Expose()
    createdAt: Date;

    @Expose()
    updatedAt: Date;

    @Expose()
    avgScore?: number;

    @Expose()
    firstReview?: string | null;

    @Expose()
    total?: number;
}
