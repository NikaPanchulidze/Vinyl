/* eslint-disable @typescript-eslint/no-floating-promises */
import { Response } from 'express';
import assert from 'node:assert';
import { randomUUID } from 'node:crypto';
import { beforeEach, describe, it } from 'node:test';
import { User } from './user.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
    let usersController: UsersController;
    const users: User[] = [];
    let fakeUsersService: Partial<UsersService>;

    beforeEach(() => {
        users.length = 0;

        fakeUsersService = {
            update: (id: string, attrs: Partial<User>) => {
                const user = users.find((u) => u.id === id);
                if (!user) throw new Error('NotFound');
                const updated = { ...user, ...attrs };
                const index = users.findIndex((u) => u.id === id);
                users[index] = updated;
                return Promise.resolve(updated);
            },
            uploadAvatar: (id: string, file: Express.Multer.File) => {
                const user = users.find((u) => u.id === id);
                if (!user) throw new Error('NotFound');
                user.avatarUrl = 'mock-avatar-url';
                return Promise.resolve(user);
            },
            delete: (id: string) => {
                const index = users.findIndex((u) => u.id === id);
                if (index === -1) throw new Error('NotFound');
                users.splice(index, 1);
                return Promise.resolve();
            },
        };

        usersController = new UsersController(fakeUsersService as UsersService);
    });

    it('should return current user from getMe', () => {
        const user: User = {
            id: randomUUID(),
            email: 'test@example.com',
            firstName: 'John',
            lastName: 'Doe',
            createdAt: new Date(),
        } as User;

        const result = usersController.getMe(user);
        assert.strictEqual(result.id, user.id);
        assert.strictEqual(result.email, user.email);
    });

    it('should update user via updateMe', async () => {
        const user: User = {
            id: randomUUID(),
            email: 'update@example.com',
            firstName: 'Old',
            lastName: 'Name',
            createdAt: new Date(),
        } as User;
        users.push(user);

        const updated = await usersController.updateMe(
            { firstName: 'New' },
            user
        );

        assert.strictEqual(updated.firstName, 'New');
        assert.strictEqual(users[0].firstName, 'New');
    });

    it('should upload avatar via uploadAvatar', async () => {
        const user: User = {
            id: randomUUID(),
            email: 'avatar@example.com',
            firstName: 'Avatar',
            lastName: 'User',
            createdAt: new Date(),
        } as User;
        users.push(user);

        const updated = await usersController.uploadAvatar(
            {} as Express.Multer.File,
            user
        );

        assert.strictEqual(updated.avatarUrl, 'mock-avatar-url');
        assert.strictEqual(users[0].avatarUrl, 'mock-avatar-url');
    });

    it('should delete user and clear cookie via deleteMe', async () => {
        const user: User = {
            id: randomUUID(),
            email: 'delete@example.com',
            firstName: 'Delete',
            lastName: 'User',
            createdAt: new Date(),
        } as User;
        users.push(user);

        let cookieCleared = false;
        const res: Partial<Response> = {
            clearCookie: (name: string, options?) => {
                if (name === 'jwt') cookieCleared = true;
                return res as Response;
            },
        };

        await usersController.deleteMe(user, res as Response);

        assert.strictEqual(users.length, 0);
        assert.ok(cookieCleared);
    });
});
