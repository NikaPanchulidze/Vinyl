/* eslint-disable @typescript-eslint/no-floating-promises */
import * as assert from 'node:assert';
import { beforeEach, describe, it } from 'node:test';
import { DiscogsService } from './discogs.service';
import { ConfigService } from '@nestjs/config';
import { VinylsService } from 'src/vinyls/vinyls.service';
import { HttpService } from '@nestjs/axios';
import { of, throwError } from 'rxjs';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { Vinyl } from 'src/vinyls/vinyl.entity';

class FakeHttpService {
    public getCalls: string[] = [];
    public responseData: any = {};
    get(url: string) {
        this.getCalls.push(url);
        return of({ data: this.responseData });
    }
}

class FakeConfigService {
    get(key: string) {
        switch (key) {
            case 'DISCOGS_BASE_URL':
                return 'https://fake.discogs.com';
            case 'DISCOGS_TOKEN':
                return 'fake-token';
            default:
                return '';
        }
    }
}

class FakeVinylsService {
    public created: Partial<Vinyl>[] = [];
    public existing: any = null;
    findByDiscogsId(id: number) {
        return Promise.resolve(this.existing);
    }
    create(data: Partial<Vinyl>) {
        this.created.push(data);
        return Promise.resolve(data);
    }
}

describe('DiscogsService', () => {
    let discogsService: DiscogsService;
    let fakeHttp: FakeHttpService;
    let fakeConfig: FakeConfigService;
    let fakeVinyls: FakeVinylsService;

    beforeEach(() => {
        fakeHttp = new FakeHttpService();
        fakeConfig = new FakeConfigService();
        fakeVinyls = new FakeVinylsService();

        discogsService = new DiscogsService(
            fakeHttp as unknown as HttpService,
            fakeConfig as unknown as ConfigService,
            fakeVinyls as unknown as VinylsService
        );
    });

    it('should search vinyls and map results', async () => {
        fakeHttp.responseData = {
            results: [
                {
                    id: 1,
                    title: 'Fake Album',
                    label: ['Fake Label'],
                    cover_image: 'fake.jpg',
                },
            ],
        };

        const results: any = await discogsService.searchVinyls({
            q: 'test',
            limit: '10',
            page: '1',
        });

        assert.strictEqual(results.length, 1);
        assert.strictEqual(results[0].discogsId, 1);
        assert.strictEqual(results[0].title, 'Fake Album');
        assert.strictEqual(results[0].authorName, 'Fake Label');
        assert.strictEqual(results[0].imageUrl, 'fake.jpg');
    });

    it('should get vinyl details', async () => {
        fakeHttp.responseData = {
            id: 42,
            title: 'Album 42',
            artists_sort: 'Artist Name',
            notes: 'Description here',
            images: [{ uri: 'image.jpg' }],
            community: { rating: { average: 4.5 } },
        };

        const details = await discogsService.getVinylDetails(42);

        assert.strictEqual(details.discogsId, 42);
        assert.strictEqual(details.name, 'Album 42');
        assert.strictEqual(details.authorName, 'Artist Name');
        assert.strictEqual(details.description, 'Description here');
        assert.strictEqual(details.imageUrl, 'image.jpg');
        assert.strictEqual(details.discogsScore, 4.5);
    });

    it('should throw NotFoundException for missing vinyl details', async () => {
        fakeHttp.get = () => throwError(() => new Error('Not found'));

        let caught = false;
        try {
            await discogsService.getVinylDetails(999);
        } catch (err) {
            caught = true;
            assert.ok(err instanceof NotFoundException);
        }
        assert.strictEqual(caught, true);
    });

    it('should add vinyl from discogs if not exists', async () => {
        discogsService.getVinylDetails = () =>
            Promise.resolve({
                discogsId: 7,
                name: 'Album 7',
                authorName: 'Artist 7',
                description: 'Desc 7',
                imageUrl: 'img7.jpg',
                discogsScore: 5,
            });

        fakeVinyls.existing = null;

        const result = await discogsService.addVinylFromDiscogs(7, 1000);

        assert.strictEqual(fakeVinyls.created.length, 1);
        assert.strictEqual(result.name, 'Album 7');
        assert.strictEqual(result.priceCents, 1000);
        assert.strictEqual(result.discogsScore, 5);
    });

    it('should throw BadRequestException if vinyl already exists', async () => {
        fakeVinyls.existing = { id: 1 };

        discogsService.getVinylDetails = () =>
            Promise.resolve({
                discogsId: 7,
                name: 'Album 7',
            });

        let caught = false;
        try {
            await discogsService.addVinylFromDiscogs(7, 1000);
        } catch (err) {
            caught = true;
            assert.ok(err instanceof BadRequestException);
        }
        assert.strictEqual(caught, true);
    });
});
