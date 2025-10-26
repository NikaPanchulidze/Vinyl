/* eslint-disable @typescript-eslint/no-floating-promises */
import * as assert from 'node:assert';
import { beforeEach, describe, it } from 'node:test';
import { AuthService } from './auth.service';
import { UsersService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';

class FakeUsersService {
    public users: any[] = [];
    findOneByEmail(email: string) {
        const user = this.users.find((u) => u.email === email);
        return Promise.resolve(user || null);
    }
    create(
        email: string,
        password: string,
        firstName: string,
        lastName: string,
        birthDate?: Date,
        provider?: string,
        providerId?: string,
        avatarUrl?: string
    ) {
        const newUser = {
            id: randomUUID(),
            email,
            password,
            firstName,
            lastName,
            birthDate,
            provider,
            providerId,
            avatarUrl,
        };
        this.users.push(newUser);
        return Promise.resolve(newUser);
    }
}

class FakeJwtService {
    public lastPayload: any;
    sign(payload: any, options: any) {
        this.lastPayload = { payload, options };
        return 'fake-jwt-token';
    }
}

class FakeConfigService {
    get(key: string) {
        switch (key) {
            case 'JWT_SECRET':
                return 'secret';
            case 'JWT_EXPIRES_IN':
                return '1';
            default:
                return '';
        }
    }
}

describe('AuthService', () => {
    let authService: AuthService;
    let usersService: FakeUsersService;
    let jwtService: FakeJwtService;
    let configService: FakeConfigService;

    beforeEach(() => {
        usersService = new FakeUsersService();
        jwtService = new FakeJwtService();
        configService = new FakeConfigService();
        authService = new AuthService(
            usersService as unknown as UsersService,
            jwtService as unknown as JwtService,
            configService as unknown as ConfigService
        );
    });

    it('should signup a new user', async () => {
        const user = await authService.signup(
            'test@example.com',
            'password123',
            'John',
            'Doe',
            new Date('2000-01-01')
        );
        assert.strictEqual(user.email, 'test@example.com');
        assert.strictEqual(user.firstName, 'John');
        assert.strictEqual(user.lastName, 'Doe');
        assert.notStrictEqual(user.password, 'password123');
        assert.ok(await bcrypt.compare('password123', user.password));
    });

    it('should throw BadRequestException if email is already in use', async () => {
        await authService.signup(
            'test@example.com',
            'password123',
            'John',
            'Doe',
            new Date('2000-01-01')
        );
        let caught = false;
        try {
            await authService.signup(
                'test@example.com',
                'password123',
                'Jane',
                'Smith',
                new Date('2001-01-01')
            );
        } catch (err) {
            caught = true;
            assert.ok(err instanceof BadRequestException);
        }
        assert.strictEqual(caught, true);
    });

    it('should signin a valid user', async () => {
        const password = 'mypassword';
        const hashed = await bcrypt.hash(password, 10);
        const user = await usersService.create(
            'login@example.com',
            hashed,
            'Alice',
            'Wonder',
            new Date('1990-01-01')
        );

        const result = await authService.signin('login@example.com', password);

        assert.strictEqual(result.user.email, 'login@example.com');
        assert.strictEqual(result.token, 'fake-jwt-token');
        assert.strictEqual(jwtService.lastPayload.payload.id, user.id);
    });

    it('should throw NotFoundException if user email does not exist on signin', async () => {
        let caught = false;
        try {
            await authService.signin('missing@example.com', 'password');
        } catch (err) {
            caught = true;
            assert.ok(err instanceof NotFoundException);
        }
        assert.strictEqual(caught, true);
    });

    it('should throw BadRequestException if password is wrong on signin', async () => {
        const hashed = await bcrypt.hash('correctpassword', 10);
        await usersService.create(
            'wrongpass@example.com',
            hashed,
            'Bob',
            'Builder',
            new Date('1985-01-01')
        );
        let caught = false;
        try {
            await authService.signin('wrongpass@example.com', 'wrongpassword');
        } catch (err) {
            caught = true;
            assert.ok(err instanceof BadRequestException);
        }
        assert.strictEqual(caught, true);
    });

    it('should create a Google user', async () => {
        const user = await authService.createGoogleUser({
            provider: 'google',
            providerId: 'google-123',
            email: 'google@example.com',
            firstName: 'Google',
            lastName: 'User',
            avatarUrl: 'avatar.jpg',
        });
        assert.strictEqual(user.email, 'google@example.com');
        assert.strictEqual(user.provider, 'google');
        assert.strictEqual(user.providerId, 'google-123');
        assert.strictEqual(user.avatarUrl, 'avatar.jpg');
    });
});
