/* eslint-disable @typescript-eslint/no-floating-promises */
import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { SystemLogsService } from './system-logs.service';
import { SystemLogsRepository } from './system-logs.repository';
import { SystemLog } from './system-log.entity';
import { randomUUID } from 'node:crypto';

describe('SystemLogsService', () => {
    let logsService: SystemLogsService;
    const logs: SystemLog[] = [];
    let fakeLogsRepo: Partial<SystemLogsRepository>;

    beforeEach(() => {
        logs.length = 0;

        fakeLogsRepo = {
            getAll: (query) => {
                const { page = 1, limit = 10 } = query;
                const start = (page - 1) * limit;
                const end = start + limit;
                const paginated = logs.slice(start, end);

                return Promise.resolve({
                    logs: paginated,
                    total: logs.length,
                    page,
                    limit,
                    lastPage: Math.ceil(logs.length / limit),
                });
            },
            create: (data: Partial<SystemLog>) => {
                const log: SystemLog = {
                    id: randomUUID(),
                    userId: data.userId!,
                    entity: data.entity || 'default-entity',
                    action: data.action || 'default-action',
                    description: data.description ?? 'default-description',
                    duration: data.duration ?? 0,
                    createdAt: new Date(),
                };
                logs.push(log);
                return Promise.resolve(log);
            },
            log: (message: string) => {
                // We'll simulate a log with all required fields
                const log: SystemLog = {
                    id: randomUUID(),
                    userId: null!,
                    entity: 'system',
                    action: 'log',
                    description: message,
                    duration: 0,
                    createdAt: new Date(),
                };
                logs.push(log);
                return Promise.resolve(log);
            },
        };

        logsService = new SystemLogsService(
            fakeLogsRepo as SystemLogsRepository
        );
    });

    it('should create a log entry successfully', async () => {
        const data: Partial<SystemLog> = {
            entity: 'users',
            action: 'create',
            description: 'Created a user',
            duration: 123,
        };
        const log = await logsService.create(data);

        assert.strictEqual(log.entity, 'users');
        assert.strictEqual(log.action, 'create');
        assert.strictEqual(log.description, 'Created a user');
        assert.strictEqual(log.duration, 123);
        assert.strictEqual(logs.length, 1);
    });

    it('should log a message successfully', async () => {
        const message = 'System log entry';
        const log = await logsService.log(message);

        assert.strictEqual(log.description, message);
        assert.strictEqual(log.entity, 'system');
        assert.strictEqual(log.action, 'log');
        assert.strictEqual(logs.length, 1);
    });

    it('should get all logs with pagination', async () => {
        // Add 15 logs
        for (let i = 0; i < 15; i++) {
            await logsService.log(`Log #${i + 1}`);
        }

        const result = await logsService.getAll({ page: 2, limit: 5 });

        assert.strictEqual(result.logs.length, 5);
        assert.strictEqual(result.total, 15);
        assert.strictEqual(result.page, 2);
        assert.strictEqual(result.limit, 5);
        assert.strictEqual(result.lastPage, 3);
        assert.strictEqual(result.logs[0].description, 'Log #6');
    });
});
