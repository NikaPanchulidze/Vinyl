import { Expose } from 'class-transformer';

export class AvatarResponseDto {
    @Expose()
    avatarUrl: string;
}
