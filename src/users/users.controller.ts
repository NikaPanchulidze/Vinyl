import {
    Body,
    Controller,
    Delete,
    Get,
    Patch,
    Post,
    Res,
    UploadedFile,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiOperation } from '@nestjs/swagger';
import { Response } from 'express';
import { Roles } from 'src/common/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { RolesGuard } from 'src/guards/roles.guard';
import { Serialize } from 'src/interceptors/serialize.interceptor';
import { CurrentUser } from './decorators/current-user.decorator';
import { UpdateUserDto } from './dtos/update-user.dto';
import { UserResponseDto } from './dtos/user-response.dto';
import { Role } from './types/roles.enum';
import { User } from './user.entity';
import { UsersService } from './users.service';
import { AvatarResponseDto } from './dtos/avatar-response.dto';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
    constructor(private readonly userService: UsersService) {}

    @Get('/me')
    @Serialize(UserResponseDto)
    @ApiOperation({ summary: 'Get current user profile' })
    public getMe(@CurrentUser() user: User): UserResponseDto {
        return user;
    }

    @Patch()
    @Serialize(UserResponseDto)
    @ApiOperation({ summary: 'Update current user profile' })
    public async updateMe(
        @Body() body: UpdateUserDto,
        @CurrentUser() user: User
    ): Promise<UserResponseDto> {
        return this.userService.update(user.id, body);
    }

    @Post('/me/avatar')
    @UseInterceptors(FileInterceptor('avatar'))
    @Serialize(AvatarResponseDto)
    @ApiOperation({ summary: 'Upload avatar for current user' })
    public uploadAvatar(
        @UploadedFile() file: Express.Multer.File,
        @CurrentUser() user: User
    ): Promise<UserResponseDto> {
        return this.userService.uploadAvatar(user.id, file);
    }

    @Roles(Role.USER)
    @Delete()
    @ApiOperation({ summary: 'Delete current user account' })
    public async deleteMe(
        @CurrentUser() user: User,
        @Res({ passthrough: true }) res: Response
    ): Promise<void> {
        await this.userService.delete(user.id);
        res.clearCookie('jwt');
    }
}
