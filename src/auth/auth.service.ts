import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';
import * as bcrypt from 'bcrypt';
import { User } from 'src/users/user.entity';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
    constructor(
        private readonly usersService: UsersService,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService
    ) {}

    private signToken(userId: string): string {
        return this.jwtService.sign(
            { id: userId },
            {
                secret: this.configService.get<string>('JWT_SECRET'),
                expiresIn:
                    Number(this.configService.get<string>('JWT_EXPIRES_IN')) *
                    24 *
                    60 *
                    60,
            }
        );
    }

    public async signup(
        email: string,
        password: string,
        firstName: string,
        lastName: string,
        birthDate: Date
    ): Promise<User> {
        const user = await this.usersService.findOneByEmail(email);

        if (user) {
            throw new BadRequestException('Email in use');
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        return this.usersService.create(
            email,
            hashedPassword,
            firstName,
            lastName,
            birthDate
        );
    }

    public async signin(
        email: string,
        password: string
    ): Promise<{ user: User; token: string }> {
        const user = await this.usersService.findOneByEmail(email);

        if (!user) {
            throw new NotFoundException('Invalid email or password');
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            throw new BadRequestException('Invalid email or password');
        }

        const token = this.signToken(user.id);

        return { user, token };
    }

    public async createGoogleUser({
        provider,
        providerId,
        email,
        firstName,
        lastName,
        avatarUrl,
    }: {
        provider: string;
        providerId: string;
        email: string;
        firstName: string;
        lastName: string;
        avatarUrl?: string;
    }): Promise<User> {
        // Create a new user with a random password since Google OAuth doesn't provide one
        const randomPassword = Math.random().toString(36).slice(-8);
        const hashedPassword = await bcrypt.hash(randomPassword, 10);

        return this.usersService.create(
            email,
            hashedPassword,
            firstName,
            lastName,
            undefined, // birthDate is not provided by Google OAuth
            provider,
            providerId,
            avatarUrl
        );
    }
}
