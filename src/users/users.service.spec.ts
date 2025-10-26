/* eslint-disable @typescript-eslint/no-floating-promises */
import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';
import { FileService } from 'src/file/file.service';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { User } from './user.entity';
import { randomUUID } from 'node:crypto';

describe('UsersService', () => {
    let usersService: UsersService;
    const users: User[] = [];
    let fakeUsersRepo: Partial<UsersRepository>;
    let fakeFileService: Partial<FileService>;
    let fakeConfigService: Partial<ConfigService>;

    beforeEach(() => {
        users.length = 0;

        fakeUsersRepo = {
            findOneByEmail: (email) =>
                Promise.resolve(users.find((u) => u.email === email) || null),
            findOneById: (id) =>
                Promise.resolve(users.find((u) => u.id === id) || null),
            create: (
                email,
                hashedPassword,
                firstName,
                lastName,
                birthDate,
                provider,
                providerId,
                avatarUrl
            ) => {
                const user: User = {
                    id: randomUUID(),
                    email,
                    password: hashedPassword,
                    firstName,
                    lastName,
                    birthDate,
                    provider,
                    providerId,
                    avatarUrl,
                    createdAt: new Date(),
                } as User;
                users.push(user);
                return Promise.resolve(user);
            },
            update: (user, attrs) => {
                const updated = { ...user, ...attrs };
                const index = users.findIndex((u) => u.id === user.id);
                if (index !== -1) users[index] = updated;
                return Promise.resolve(updated);
            },
            delete: (id) => {
                const index = users.findIndex((u) => u.id === id);
                if (index !== -1) users.splice(index, 1);
                return Promise.resolve();
            },
        };

        fakeFileService = {
            uploadImage: () => Promise.resolve('mock-url'),
            deleteFile: () => Promise.resolve(),
        };

        fakeConfigService = {
            get: (key: string) =>
                key === 'S3_BUCKET_NAME' ? 'mock-bucket' : null,
        };

        usersService = new UsersService(
            fakeUsersRepo as UsersRepository,
            fakeFileService as FileService,
            fakeConfigService as ConfigService
        );
    });

    it('should create a user successfully', async () => {
        const user = await usersService.create(
            'test@example.com',
            'hashedPass',
            'John',
            'Doe'
        );
        assert.strictEqual(user.email, 'test@example.com');
        assert.strictEqual(users.length, 1);
        assert.ok(user.id.length > 0);
    });

    it('should update a user successfully', async () => {
        const user = await usersService.create(
            'test2@example.com',
            'hashedPass',
            'Old FirstName',
            'Old LastName'
        );

        const updated = await usersService.update(user.id, {
            firstName: 'New FirstName',
        });
        assert.strictEqual(updated.firstName, 'New FirstName');
    });

    it('should find a user by email', async () => {
        const user = await usersService.create(
            'findme@example.com',
            'hashedPass',
            'Find',
            'Me'
        );
        const found = await usersService.findOneByEmail('findme@example.com');
        assert.strictEqual(found?.id, user.id);
    });

    it('should return null if findOneByEmail called with unknown email', async () => {
        const found = await usersService.findOneByEmail('unknown@example.com');
        assert.strictEqual(found, null);
    });

    it('should find a user by id', async () => {
        const user = await usersService.create(
            'findbyid@example.com',
            'hashedPass',
            'ID',
            'Finder'
        );
        const found = await usersService.findOneById(user.id);
        assert.strictEqual(found?.email, user.email);
    });

    it('should return null if findOneById called with unknown id', async () => {
        const found = await usersService.findOneById('nonexistent-uuid');
        assert.strictEqual(found, null);
    });

    it('should throw BadRequestException if update called with no fields', async () => {
        const user = await usersService.create(
            'test3@example.com',
            'hashedPass',
            'Bob',
            'Builder'
        );

        let caught: Error | null = null;
        try {
            await usersService.update(user.id, {});
        } catch (err) {
            caught = err as Error;
        }
        assert.ok(caught instanceof BadRequestException);
    });

    it('should throw NotFoundException if update called with invalid id', async () => {
        let caught: Error | null = null;
        try {
            await usersService.update('nonexistent-uuid', { firstName: 'X' });
        } catch (err) {
            caught = err as Error;
        }
        assert.ok(caught instanceof NotFoundException);
    });

    it('should delete a user successfully', async () => {
        const user = await usersService.create(
            'test4@example.com',
            'hashedPass',
            'Vaxtang',
            'Beridze'
        );

        await usersService.delete(user.id);
        assert.strictEqual(users.length, 0);
    });

    it('should throw NotFoundException when deleting non-existent user', async () => {
        let caught: Error | null = null;
        try {
            await usersService.delete('nonexistent-uuid');
        } catch (err) {
            caught = err as Error;
        }
        assert.ok(caught instanceof NotFoundException);
    });

    it('should upload avatar successfully', async () => {
        const user = await usersService.create(
            'test5@example.com',
            'hashedPass',
            'Nikola',
            'Tesla'
        );

        const updated = await usersService.uploadAvatar(
            user.id,
            {} as Express.Multer.File
        );
        assert.strictEqual(updated.avatarUrl, 'mock-url');
    });

    it('should throw NotFoundException if uploadAvatar called with invalid id', async () => {
        let caught: Error | null = null;
        try {
            await usersService.uploadAvatar(
                'nonexistent-uuid',
                {} as Express.Multer.File
            );
        } catch (err) {
            caught = err as Error;
        }
        assert.ok(caught instanceof NotFoundException);
    });
});
