import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { JwtPayload } from 'jsonwebtoken';
import { UsersService } from 'src/users/users.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        private readonly usersService: UsersService,
        private readonly configService: ConfigService
    ) {
        const isTest =
            process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'e2e';
        const secret = isTest
            ? process.env.JWT_SECRET || 'test-secret'
            : configService.get<string>('JWT_SECRET') || 'default_secret';

        super({
            jwtFromRequest: ExtractJwt.fromExtractors([
                (req: Request) => {
                    let token: string | null = null;

                    // Authorization header
                    if (req.headers.authorization?.startsWith('Bearer ')) {
                        token = req.headers.authorization.split(' ')[1];
                    }
                    // Cookie
                    else if ((req.cookies as { jwt?: string })?.jwt) {
                        token = (req.cookies as { jwt?: string }).jwt ?? null;
                    }

                    return token;
                },
            ]),
            ignoreExpiration: false,
            secretOrKey: secret,
            passReqToCallback: false,
        });
    }

    async validate(payload: JwtPayload) {
        try {
            if (!payload?.id)
                throw new UnauthorizedException('Invalid token payload');
            const user = await this.usersService.findOneById(
                String(payload.id)
            );
            if (!user) throw new UnauthorizedException('User not found');

            // This will be attached to req.user automatically
            return user;
        } catch (err: unknown) {
            throw new UnauthorizedException('Invalid token');
        }
    }
}
