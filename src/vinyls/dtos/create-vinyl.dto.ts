import { ApiProperty } from '@nestjs/swagger';
import {
    IsEnum,
    IsInt,
    IsOptional,
    IsString,
    Length,
    MaxLength,
    Min,
} from 'class-validator';
import { TrimString } from 'src/common/decorators/trim-string.decorator';
import { Currency } from '../../common/types/currency.enum';

export class CreateVinylDto {
    @IsString()
    @MaxLength(100)
    @TrimString()
    @ApiProperty({
        example: 'Abbey Road',
    })
    name: string;

    @IsString()
    @MaxLength(100)
    @TrimString()
    @ApiProperty({
        example: 'The Beatles',
    })
    authorName: string;

    @IsString()
    @Length(5, 1000, {
        message: 'Description must be between 5 and 1000 characters',
    })
    @TrimString()
    @ApiProperty({
        example: 'A classic album by The Beatles',
    })
    description: string;

    @IsInt()
    @Min(60)
    @ApiProperty({
        example: 2999,
    })
    priceCents: number;

    @IsOptional()
    @IsEnum(Currency)
    @ApiProperty({
        example: Currency.USD,
    })
    currency?: Currency;

    // Automatically fetched from Discogs API
    discogsId?: number;

    discogsScore?: number;

    imageUrl?: string;
}
