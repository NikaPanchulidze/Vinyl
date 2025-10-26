import { Body, Controller, Get, Post, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiOperation } from '@nestjs/swagger';
import { Response } from 'express';
import { Serialize } from 'src/interceptors/serialize.interceptor';
import { CurrentUser } from 'src/users/decorators/current-user.decorator';
import { User } from 'src/users/user.entity';
import { UserResponseDto } from '../users/dtos/user-response.dto';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dtos/create-user.dto';
import { LoginUserDto } from './dtos/login-user.dto';

@Controller('auth')
@Serialize(UserResponseDto)
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('/signup')
    @ApiOperation({ summary: 'Register a new user' })
    public async createUser(
        @Body() body: CreateUserDto
    ): Promise<UserResponseDto> {
        return this.authService.signup(
            body.email,
            body.password,
            body.firstName,
            body.lastName,
            body.birthDate
        );
    }

    @Post('/signin')
    @ApiOperation({ summary: 'Login a user' })
    public async loginUser(
        @Body() body: LoginUserDto,
        @Res({ passthrough: true }) res: Response
    ): Promise<UserResponseDto> {
        const { user, token } = await this.authService.signin(
            body.email,
            body.password
        );

        res.cookie('jwt', token);

        return user;
    }

    @Get('google')
    @UseGuards(AuthGuard('google'))
    @ApiOperation({ summary: 'Login with Google' })
    public async googleLogin(): Promise<void> {
        // Redirects to Google login
    }

    @Get('google/callback')
    @UseGuards(AuthGuard('google'))
    public googleCallback(
        @CurrentUser() user: User,
        @Res({ passthrough: true }) res: Response
    ): void {
        const token = this.authService['signToken'](user.id);

        res.cookie('jwt', token);

        res.redirect(`${process.env.URL}/users/me`);
    }

    @Get('/logout')
    @ApiOperation({ summary: 'Log out' })
    public logout(@Res({ passthrough: true }) res: Response): void {
        res.clearCookie('jwt');
    }
}
