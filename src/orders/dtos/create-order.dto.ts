import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsUUID } from 'class-validator';

export class CreateOrderDto {
    @IsArray()
    @ArrayNotEmpty()
    @IsUUID('4', { each: true })
    @ApiProperty({
        example: [
            '550e8400-e29b-41d4-a716-446655440000',
            '660e8400-e29b-41d4-a716-446655440111',
        ],
        description: 'Array of vinyl IDs to be included in the order',
    })
    vinylIds: string[];
}
