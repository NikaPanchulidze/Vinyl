import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class LoginUserDto {
    @ApiProperty({
        example: 'nikapanchulidze@example.com',
    })
    @IsEmail()
    email: string;

    @ApiProperty({
        example: 'Password123',
    })
    @IsString()
    password: string;
}
