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

export class UpdateVinylDto {
    @IsOptional()
    @IsString()
    @MaxLength(100)
    @TrimString()
    name?: string;

    @IsOptional()
    @IsString()
    @MaxLength(100)
    @TrimString()
    authorName?: string;

    @IsOptional()
    @IsString()
    @Length(5, 1000, {
        message: 'Description must be between 5 and 1000 characters',
    })
    @TrimString()
    description?: string;

    @IsOptional()
    @IsInt()
    @Min(60)
    priceCents?: number;

    @IsOptional()
    @IsEnum(Currency)
    currency?: Currency;
}
