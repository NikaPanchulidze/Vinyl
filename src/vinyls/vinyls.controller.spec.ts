/* eslint-disable @typescript-eslint/no-floating-promises */
import * as assert from 'node:assert';
import { beforeEach, describe, it } from 'node:test';
import { VinylsController } from './vinyls.controller';
import { VinylsService } from './vinyls.service';
import { VinylQueryDto } from './dtos/query-params.dto';
import { VinylResponseDto } from './dtos/vinyl-response.dto';
import { User } from 'src/users/user.entity';
import { Currency } from '../common/types/currency.enum';

describe('VinylsController', () => {
    let controller: VinylsController;
    let fakeService: Partial<VinylsService>;

    beforeEach(() => {
        fakeService = {
            findAll: (query: VinylQueryDto, userId?: string) => {
                const vinyls: VinylResponseDto[] = [
                    {
                        id: 'v1',
                        name: 'Test Vinyl',
                        authorName: 'Author A',
                        description: 'Description A',
                        priceCents: 1000,
                        currency: Currency.USD,
                        imageUrl: undefined,
                        discogsId: undefined,
                        discogsScore: undefined,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    },
                ];
                return Promise.resolve({
                    vinyls,
                    total: vinyls.length,
                    page: query.page || 1,
                    lastPage: Math.ceil(vinyls.length / (query.limit || 10)),
                });
            },
        };

        controller = new VinylsController(fakeService as VinylsService);
    });

    it('should call findAll and return vinyls with pagination', async () => {
        const query: VinylQueryDto = { page: 1, limit: 10 };
        const user: User = { id: 'u1' } as User;

        const result = await controller.getAllVinyls(query, user);

        assert.strictEqual(result.vinyls.length, 1);
        assert.strictEqual(result.total, 1);
        assert.strictEqual(result.page, 1);
        assert.strictEqual(result.lastPage, 1);
        assert.strictEqual(result.vinyls[0].name, 'Test Vinyl');
    });

    it('should handle undefined user (optional auth)', async () => {
        const query: VinylQueryDto = { page: 1, limit: 10 };
        const result = await controller.getAllVinyls(query, {} as User);

        assert.strictEqual(result.vinyls.length, 1);
        assert.strictEqual(result.total, 1);
        assert.strictEqual(result.page, 1);
        assert.strictEqual(result.lastPage, 1);
    });
});
