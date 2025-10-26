import { Expose } from 'class-transformer';

export class VinylImageResponseDto {
    @Expose()
    imageUrl: string;
}
