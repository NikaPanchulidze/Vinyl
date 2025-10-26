import { Type } from 'class-transformer';
import {
    IsDateString,
    IsIn,
    IsInt,
    IsOptional,
    Max,
    Min,
} from 'class-validator';

export class QueryLogsDto {
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number = 1;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limit?: number = 10;

    @IsOptional()
    @IsDateString()
    startDate?: string;

    @IsOptional()
    userId?: string;

    @IsOptional()
    entity?: string;

    @IsOptional()
    action?: string;

    @IsOptional()
    @IsIn(['ASC', 'DESC'])
    sortOrder?: 'ASC' | 'DESC' = 'DESC';
}
