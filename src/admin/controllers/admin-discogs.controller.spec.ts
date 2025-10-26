/* eslint-disable @typescript-eslint/no-floating-promises */
import * as assert from 'node:assert';
import { beforeEach, describe, it } from 'node:test';
import { DiscogsService } from 'src/discogs/discogs.service';
import { AdminDiscogsController } from './admin-discogs.controller';

class FakeDiscogsService {
    public searchCalledWith: any;
    public getDetailsCalledWith: any;
    public addVinylCalledWith: any;

    searchVinyls(query: any) {
        this.searchCalledWith = query;
        return [
            {
                discogsId: 1,
                name: 'Fake Album',
                authorName: 'Fake Label',
                imageUrl: 'fake.jpg',
            },
        ];
    }

    getVinylDetails(id: number) {
        this.getDetailsCalledWith = id;
        return {
            discogsId: id,
            name: 'Fake Album Detail',
            authorName: 'Fake Artist',
            imageUrl: 'detail.jpg',
        };
    }

    addVinylFromDiscogs(discogsId: number, priceCents: number) {
        this.addVinylCalledWith = { discogsId, priceCents };
        return {
            discogsId,
            name: 'Added Album',
            authorName: 'Added Artist',
            priceCents,
            imageUrl: 'added.jpg',
        };
    }
}

describe('AdminDiscogsController', () => {
    let controller: AdminDiscogsController;
    let fakeDiscogsService: FakeDiscogsService;

    beforeEach(() => {
        fakeDiscogsService = new FakeDiscogsService();
        controller = new AdminDiscogsController(
            fakeDiscogsService as unknown as DiscogsService
        );
    });

    it('should call searchVinyls with query and return results', async () => {
        const query = { q: 'test', limit: '10', page: '1' };
        const results = await controller.search(query);

        assert.strictEqual(fakeDiscogsService.searchCalledWith, query);
        assert.strictEqual(results.length, 1);
        assert.strictEqual(results[0].name, 'Fake Album');
        assert.strictEqual(results[0].authorName, 'Fake Label');
    });

    it('should call getVinylDetails with id and return details', async () => {
        const result = await controller.getDetails(42);

        assert.strictEqual(fakeDiscogsService.getDetailsCalledWith, 42);
        assert.strictEqual(result.name, 'Fake Album Detail');
        assert.strictEqual(result.authorName, 'Fake Artist');
    });

    it('should call addVinylFromDiscogs with discogsId and priceCents', async () => {
        const body = { discogsId: 7, priceCents: 1200 };
        const result = await controller.addVinyl(body);

        assert.deepStrictEqual(fakeDiscogsService.addVinylCalledWith, {
            discogsId: 7,
            priceCents: 1200,
        });
        assert.strictEqual(result.name, 'Added Album');
        assert.strictEqual(result.priceCents, 1200);
        assert.strictEqual(result.authorName, 'Added Artist');
    });
});
