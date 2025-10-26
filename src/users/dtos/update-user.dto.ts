import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsOptional, IsString, Length } from 'class-validator';
import { TrimString } from 'src/common/decorators/trim-string.decorator';

export class UpdateUserDto {
    @IsString()
    @IsOptional()
    @TrimString()
    @Length(2, 50, {
        message: 'First name must be between 2 and 50 characters',
    })
    @ApiProperty({
        example: 'John',
    })
    firstName?: string;

    @IsString()
    @IsOptional()
    @TrimString()
    @Length(2, 50, { message: 'Last name must be between 2 and 50 characters' })
    @ApiProperty({
        example: 'Doe',
    })
    lastName?: string;

    @IsOptional()
    @Type(() => Date)
    @IsDate({ message: 'birthDate must be a valid date' })
    @ApiProperty({
        example: '2004-04-08',
    })
    birthDate?: Date;
}
