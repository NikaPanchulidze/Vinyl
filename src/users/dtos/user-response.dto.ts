import { Expose } from 'class-transformer';

export class UserResponseDto {
    @Expose()
    id: string;

    @Expose()
    firstName: string;

    @Expose()
    lastName: string;

    @Expose()
    email: string;

    @Expose()
    birthDate?: Date;

    @Expose()
    avatarUrl?: string;

    @Expose()
    createdAt: Date;

    @Expose()
    updatedAt: Date;
}
