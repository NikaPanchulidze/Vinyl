import { Expose, Type } from 'class-transformer';

class UserDto {
    @Expose()
    id: string;

    @Expose()
    firstName: string;

    @Expose()
    lastName: string;
}

class VinylDto {
    @Expose()
    id: string;
}

export class ReviewResponseDto {
    @Expose()
    id: string;

    @Expose()
    rating: number;

    @Expose()
    comment: string;

    @Type(() => UserDto)
    @Expose()
    user: UserDto;

    @Type(() => VinylDto)
    @Expose()
    vinyl: VinylDto;

    @Expose()
    createdAt: Date;

    @Expose()
    updatedAt: Date;
}
