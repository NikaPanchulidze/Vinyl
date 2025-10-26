import { IsOptional, IsInt, Min, IsString, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class VinylQueryDto {
    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @IsIn(['priceCents', 'name', 'authorName'])
    sortBy?: 'priceCents' | 'name' | 'authorName';

    @IsOptional()
    @IsIn(['ASC', 'DESC'])
    sortOrder?: 'ASC' | 'DESC';

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number = 1;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    limit?: number = 10;
}
