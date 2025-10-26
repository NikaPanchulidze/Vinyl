import { Expose, Type } from 'class-transformer';

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
    createdAt: Date;

    @Expose()
    updatedAt: Date;
}

export class OrderItemResponseDto {
    @Expose()
    id: string;

    @Expose()
    priceCents: number;

    @Type(() => VinylResponseDto)
    @Expose()
    vinyl: VinylResponseDto;
}

export class OrderResponseDto {
    @Expose()
    id: string;

    @Type(() => OrderItemResponseDto)
    @Expose()
    items: OrderItemResponseDto[];

    @Expose()
    totalAmountCents: number;

    @Expose()
    currency: string;

    @Expose()
    status: string;

    @Expose()
    createdAt: Date;

    @Expose()
    updatedAt: Date;
}
