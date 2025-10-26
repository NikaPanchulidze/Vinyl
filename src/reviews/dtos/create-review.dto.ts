import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, Length, Max, Min } from 'class-validator';
import { TrimString } from 'src/common/decorators/trim-string.decorator';

export class CreateReviewDto {
    @IsInt()
    @Min(1)
    @Max(5)
    @ApiProperty({
        example: 5,
        description: 'Rating given by the user, from 1 to 5',
    })
    rating: number;

    @IsString()
    @Length(5, 1000)
    @TrimString()
    @ApiProperty({
        example: 'Great vinyl!',
        description: 'Comment left by the user',
    })
    comment: string;
}
