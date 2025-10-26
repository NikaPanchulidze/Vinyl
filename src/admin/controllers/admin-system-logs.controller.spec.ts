/* eslint-disable @typescript-eslint/no-floating-promises */
import * as assert from 'node:assert';
import { beforeEach, describe, it } from 'node:test';
import { AdminLogsController } from './admin-system-logs.controller';
import { SystemLogsService } from 'src/system-logs/system-logs.service';

class FakeSystemLogsService {
    public logs = [
        {
            id: '1',
            userId: 'user1',
            entity: 'User',
            action: 'CREATE',
            description: 'Created a user',
            duration: 120,
            createdAt: new Date('2025-10-24T12:00:00Z'),
        },
        {
            id: '2',
            userId: 'user2',
            entity: 'Order',
            action: 'DELETE',
            description: 'Deleted an order',
            duration: 50,
            createdAt: new Date('2025-10-24T13:00:00Z'),
        },
    ];

    getAll(query: any) {
        let result = this.logs;
        if (query.entity) {
            result = result.filter((log) => log.entity === query.entity);
        }
        return { logs: result, total: result.length };
    }
}

describe('AdminLogsController', () => {
    let controller: AdminLogsController;
    let fakeService: FakeSystemLogsService;

    beforeEach(() => {
        fakeService = new FakeSystemLogsService();
        controller = new AdminLogsController(
            fakeService as unknown as SystemLogsService
        );
    });

    it('should return all logs', async () => {
        const response = await controller.findAll({});
        assert.strictEqual(response.total, 2);
        assert.strictEqual(response.logs[0].entity, 'User');
        assert.strictEqual(response.logs[1].entity, 'Order');
    });

    it('should filter logs by entity', async () => {
        const response = await controller.findAll({ entity: 'User' });
        assert.strictEqual(response.total, 1);
        assert.strictEqual(response.logs[0].entity, 'User');
        assert.strictEqual(response.logs[0].action, 'CREATE');
    });

    it('should return empty array if no logs match filter', async () => {
        const response = await controller.findAll({ entity: 'Vinyl' });
        assert.strictEqual(response.total, 0);
        assert.deepStrictEqual(response.logs, []);
    });
});
