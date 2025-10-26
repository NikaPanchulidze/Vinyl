import { IsString } from 'class-validator';

export class SearchDiscogDto {
    @IsString()
    q: string;

    @IsString()
    page: string;

    @IsString()
    limit: string;
}
