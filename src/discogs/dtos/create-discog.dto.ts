import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min } from 'class-validator';

export class CreateDiscogDto {
    @ApiProperty({
        example: 12345,
    })
    @IsNumber()
    discogsId: number;

    @ApiProperty({
        example: 1999,
    })
    @IsNumber()
    @Min(60, {
        message: 'Price must be at least 60 cents',
    })
    priceCents: number;
}
