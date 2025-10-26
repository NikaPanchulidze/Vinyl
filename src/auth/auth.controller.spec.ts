/* eslint-disable @typescript-eslint/no-floating-promises */
import * as assert from 'node:assert';
import { beforeEach, describe, it } from 'node:test';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { User } from 'src/users/user.entity';
import { Response } from 'express';
import { BadRequestException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';

class FakeAuthService {
    public users: any[] = [];
    public lastSigninArgs: any;
    public token = 'fake-jwt-token';

    signup(
        email: string,
        password: string,
        firstName: string,
        lastName: string,
        birthDate: Date
    ) {
        const existing = this.users.find((u) => u.email === email);
        if (existing) throw new BadRequestException('Email in use');

        const newUser = {
            id: randomUUID(),
            email,
            firstName,
            lastName,
            birthDate,
        };
        this.users.push(newUser);
        return newUser;
    }

    signin(email: string, password: string) {
        const user = this.users.find((u) => u.email === email);
        if (!user) throw new BadRequestException('Invalid email or password');

        this.lastSigninArgs = { email, password };
        return { user, token: this.token };
    }

    signToken(userId: string) {
        return this.token;
    }
}

class FakeResponse {
    public cookies: Record<string, any> = {};
    public redirectedTo: string | null = null;
    cookie(name: string, value: string) {
        this.cookies[name] = value;
    }
    clearCookie(name: string) {
        delete this.cookies[name];
    }
    redirect(url: string) {
        this.redirectedTo = url;
    }
}

describe('AuthController', () => {
    let authController: AuthController;
    let authService: FakeAuthService;

    beforeEach(() => {
        authService = new FakeAuthService();
        authController = new AuthController(
            authService as unknown as AuthService
        );
    });

    it('should create a new user via /signup', async () => {
        const body = {
            email: 'test@example.com',
            password: 'password123',
            firstName: 'John',
            lastName: 'Doe',
            birthDate: new Date('2000-01-01'),
        };
        const user = await authController.createUser(body);
        assert.strictEqual(user.email, 'test@example.com');
        assert.strictEqual(user.firstName, 'John');
        assert.strictEqual(user.lastName, 'Doe');
    });

    it('should login user via /signin and set cookie', async () => {
        const userBody = {
            email: 'login@example.com',
            password: 'password123',
            firstName: 'Alice',
            lastName: 'Smith',
            birthDate: new Date(),
        };
        await authController.createUser(userBody);

        const res = new FakeResponse();
        const loginBody = {
            email: 'login@example.com',
            password: 'password123',
        };
        const user = await authController.loginUser(
            loginBody,
            res as unknown as Response
        );

        assert.strictEqual(user.email, 'login@example.com');
        assert.strictEqual(res.cookies['jwt'], authService.token);
    });

    it('should call signToken and redirect for google/callback', () => {
        const res = new FakeResponse();
        const user: User = {
            id: 'user-123',
            email: 'guser@example.com',
        } as User;

        authController.googleCallback(user, res as unknown as Response);

        assert.strictEqual(res.cookies['jwt'], authService.token);
        assert.strictEqual(res.redirectedTo, `${process.env.URL}/users/me`);
    });

    it('should clear cookie on logout', () => {
        const res = new FakeResponse();
        res.cookie('jwt', 'some-token');

        authController.logout(res as unknown as Response);
        assert.strictEqual(res.cookies['jwt'], undefined);
    });

    it('should throw on duplicate email during signup', async () => {
        const body = {
            email: 'duplicate@example.com',
            password: 'pass',
            firstName: 'Foo',
            lastName: 'Bar',
            birthDate: new Date(),
        };
        await authController.createUser(body);

        let caught = false;
        try {
            await authController.createUser(body);
        } catch (err) {
            caught = true;
            assert.ok(err instanceof BadRequestException);
        }
        assert.strictEqual(caught, true);
    });
});
