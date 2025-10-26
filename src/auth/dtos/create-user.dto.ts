import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsEmail, IsString, Length, MinLength } from 'class-validator';
import { TrimString } from 'src/common/decorators/trim-string.decorator';

export class CreateUserDto {
    @ApiProperty({
        example: 'Nika',
    })
    @IsString()
    @Length(2, 50, {
        message: 'First name must be between 2 and 50 characters',
    })
    @TrimString()
    firstName: string;

    @ApiProperty({
        example: 'Panchulidze',
    })
    @IsString()
    @Length(2, 50, { message: 'Last name must be between 2 and 50 characters' })
    @TrimString()
    lastName: string;

    @ApiProperty({
        example: 'nikapanchulidze@example.com',
    })
    @IsEmail()
    @TrimString()
    email: string;

    @ApiProperty({
        example: 'Password123',
    })
    @IsString()
    @MinLength(8, { message: 'Password must be at least 8 characters long' })
    password: string;

    @ApiProperty({
        example: '1995-08-15',
    })
    @Type(() => Date)
    @IsDate({ message: 'birthDate must be a valid date' })
    birthDate: Date;
}
