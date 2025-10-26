/* eslint-disable @typescript-eslint/no-floating-promises */
import * as assert from 'node:assert';
import { beforeEach, describe, it } from 'node:test';
import { AdminVinylsController } from './admin-vinyls.controller';
import { VinylsService } from 'src/vinyls/vinyls.service';
import { Vinyl } from 'src/vinyls/vinyl.entity';
import { randomUUID } from 'node:crypto';

class FakeVinylsService {
    public vinyls: Vinyl[] = [];
    public images: Record<string, any> = {};

    create(body: any) {
        const vinyl = {
            id: randomUUID(),
            ...body,
        } as Vinyl;
        this.vinyls.push(vinyl);
        return Promise.resolve(vinyl);
    }

    uploadVinylImage(id: string, file: Express.Multer.File) {
        const vinyl = this.vinyls.find((v) => v.id === id);
        if (!vinyl) throw new Error('Vinyl not found');
        this.images[id] = file;
        return Promise.resolve({ ...vinyl, imageUrl: file.originalname });
    }

    update(id: string, body: any) {
        const vinyl = this.vinyls.find((v) => v.id === id);
        if (!vinyl) throw new Error('Vinyl not found');
        Object.assign(vinyl, body);
        return Promise.resolve(vinyl);
    }

    delete(id: string) {
        const index = this.vinyls.findIndex((v) => v.id === id);
        if (index === -1) throw new Error('Vinyl not found');
        this.vinyls.splice(index, 1);
        return Promise.resolve();
    }
}

describe('AdminVinylsController', () => {
    let controller: AdminVinylsController;
    let fakeService: FakeVinylsService;

    beforeEach(() => {
        fakeService = new FakeVinylsService();
        controller = new AdminVinylsController(
            fakeService as unknown as VinylsService
        );
    });

    it('should create a new vinyl', async () => {
        const vinylData = {
            name: 'Test Album',
            authorName: 'Artist',
            priceCents: 1000,
        } as Vinyl;
        const vinyl = await controller.createVinyl(vinylData);
        assert.strictEqual(vinyl.name, 'Test Album');
        assert.strictEqual(fakeService.vinyls.length, 1);
    });

    it('should upload image for a vinyl', async () => {
        const vinyl = await controller.createVinyl({
            name: 'Album 1',
            authorName: 'Artist',
            priceCents: 500,
            description: 'Test description',
        });
        const file = { originalname: 'cover.jpg' } as Express.Multer.File;
        const result = await controller.uploadImage(file, vinyl.id);
        assert.strictEqual(result.imageUrl, 'cover.jpg');
        assert.strictEqual(
            fakeService.images[vinyl.id].originalname,
            'cover.jpg'
        );
    });

    it('should update vinyl details', async () => {
        const vinyl = await controller.createVinyl({
            name: 'Old Title',
            authorName: 'Artist',
            priceCents: 500,
            description: 'Test description',
        });
        const updated = await controller.updateVinyl(vinyl.id, {
            name: 'New Title',
        });
        assert.strictEqual(updated.name, 'New Title');
    });

    it('should delete a vinyl', async () => {
        const vinyl = await controller.createVinyl({
            name: 'To Delete',
            authorName: 'Artist',
            priceCents: 300,
            description: 'Test description',
        });
        await controller.deleteVinyl(vinyl.id);
        assert.strictEqual(fakeService.vinyls.length, 0);
    });
});
