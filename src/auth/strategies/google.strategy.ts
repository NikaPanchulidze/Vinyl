import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy, VerifyCallback } from 'passport-google-oauth20';
import { UsersService } from 'src/users/users.service';
import { AuthService } from '../auth.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
    constructor(
        private readonly usersService: UsersService,
        private readonly authService: AuthService,
        private readonly configService: ConfigService
    ) {
        const isTest =
            process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'e2e';

        super({
            clientID: isTest
                ? process.env.GOOGLE_CLIENT_ID || 'test-client-id'
                : configService.get<string>('GOOGLE_CLIENT_ID')!,
            clientSecret: isTest
                ? process.env.GOOGLE_CLIENT_SECRET || 'test-client-secret'
                : configService.get<string>('GOOGLE_CLIENT_SECRET')!,
            callbackURL: isTest
                ? process.env.GOOGLE_CALLBACK_URL ||
                  'http://localhost:3000/auth/google/callback'
                : configService.get<string>('GOOGLE_CALLBACK_URL')!,
            scope: ['email', 'profile'],
        });
    }

    async validate(
        accessToken: string,
        refreshToken: string,
        profile: Profile,
        done: VerifyCallback
    ): Promise<void> {
        try {
            const { id, emails, name, photos } = profile;

            if (!emails || emails.length === 0) {
                throw new UnauthorizedException(
                    'No email found from Google account'
                );
            }

            const email = emails[0].value;
            let user = await this.usersService.findOneByEmail(email);

            if (!user) {
                user = await this.authService.createGoogleUser({
                    email,
                    provider: 'google',
                    providerId: id,
                    firstName: name!.givenName,
                    lastName: name!.familyName,
                    avatarUrl: photos?.[0]?.value,
                });
            } else if (user.provider !== 'google') {
                throw new UnauthorizedException(
                    `Email is already registered with ${user.provider} provider`
                );
            }

            done(null, user);
        } catch (err: unknown) {
            if (err instanceof Error) {
                done(new UnauthorizedException(err.message), false);
            } else {
                done(
                    new UnauthorizedException('Google authentication failed'),
                    false
                );
            }
        }
    }
}
