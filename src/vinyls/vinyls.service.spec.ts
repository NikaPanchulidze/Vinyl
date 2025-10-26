/* eslint-disable @typescript-eslint/no-floating-promises */
import { ConfigService } from '@nestjs/config';
import * as assert from 'node:assert';
import { randomUUID } from 'node:crypto';
import { beforeEach, describe, it } from 'node:test';
import { EventBusService } from 'src/eventBus/eventBus.service';
import { FileService } from 'src/file/file.service';
import { CreateVinylDto } from './dtos/create-vinyl.dto';
import { Vinyl } from './vinyl.entity';
import { VinylsRepository } from './vinyls.repository';
import { VinylsService } from './vinyls.service';
import { Currency } from '../common/types/currency.enum';

describe('VinylsService', () => {
    let service: VinylsService;
    let fakeRepo: Partial<VinylsRepository>;
    let fakeFileService: Partial<FileService>;
    let fakeEventBus: Partial<EventBusService>;
    let fakeConfigService: Partial<ConfigService>;
    const vinyls: Vinyl[] = [];

    beforeEach(() => {
        vinyls.length = 0;

        fakeRepo = {
            findAll: (query: any, userId?: string) => {
                return Promise.resolve({
                    vinyls,
                    total: vinyls.length,
                    page: query.page || 1,
                    lastPage: Math.ceil(vinyls.length / (query.limit || 10)),
                });
            },
            findById: (id: string) =>
                Promise.resolve(vinyls.find((v) => v.id === id) || null),
            findByDiscogsId: (discogsId: number) =>
                Promise.resolve(
                    vinyls.find((v) => v.discogsId === discogsId) || null
                ),
            create: (body: CreateVinylDto) => {
                const newVinyl: Vinyl = {
                    id: randomUUID(),
                    name: body.name,
                    authorName: body.authorName,
                    description: body.description,
                    priceCents: body.priceCents,
                    currency: body.currency || Currency.USD,
                } as Vinyl;
                vinyls.push(newVinyl);
                return Promise.resolve(newVinyl);
            },
            update: (vinyl: Vinyl, attrs: Partial<Vinyl>) => {
                Object.assign(vinyl, attrs);
                return Promise.resolve(vinyl);
            },
            delete: (id: string) => {
                const index = vinyls.findIndex((v) => v.id === id);
                if (index !== -1) vinyls.splice(index, 1);
                return Promise.resolve();
            },
        };

        fakeFileService = {
            uploadImage: (
                file: Express.Multer.File,
                folder: string,
                id: string
            ) => Promise.resolve(`https://fake.com/${folder}/${id}.jpg`),
            deleteFile: async (path: string) => {},
        };

        fakeEventBus = {
            emit: (eventName: string, ...payload: unknown[]) => true,
        };

        fakeConfigService = {
            get: (key: string) => {
                if (key === 'S3_BUCKET_NAME') return 'test-bucket';
                return '';
            },
        };

        service = new VinylsService(
            fakeRepo as VinylsRepository,
            fakeFileService as FileService,
            fakeEventBus as EventBusService,
            fakeConfigService as ConfigService
        );
    });

    it('should return all vinyls', async () => {
        vinyls.push({
            id: 'v1',
            name: 'Test Vinyl',
            authorName: 'Author A',
            description: 'Description A',
            priceCents: 1000,
            currency: Currency.USD,
        } as Vinyl);

        const result = await service.findAll({ page: 1, limit: 10 });

        assert.strictEqual(result.vinyls.length, 1);
        assert.strictEqual(result.total, 1);
        assert.strictEqual(result.page, 1);
        assert.strictEqual(result.lastPage, 1);
    });

    it('should find a vinyl by id', async () => {
        const v: Vinyl = {
            id: 'v1',
            name: 'Vinyl A',
            authorName: 'Author A',
            description: 'Description A',
            priceCents: 1200,
            currency: Currency.USD,
        } as Vinyl;
        vinyls.push(v);

        const result = await service.findById('v1');
        assert.strictEqual(result?.id, 'v1');
    });

    it('should return null for non-existing id', async () => {
        const result = await service.findById('non-existing');
        assert.strictEqual(result, null);
    });

    it('should create a vinyl and emit event', async () => {
        const dto: CreateVinylDto = {
            name: 'New Vinyl',
            authorName: 'Test Author',
            description: 'Test Description',
            priceCents: 1500,
            currency: Currency.USD,
        };

        const vinyl = await service.create(dto);

        assert.ok(vinyl.id);
        assert.strictEqual(vinyl.name, 'New Vinyl');
        assert.strictEqual(vinyl.authorName, 'Test Author');
        assert.strictEqual(vinyl.description, 'Test Description');
        assert.strictEqual(vinyl.priceCents, 1500);
        assert.strictEqual(vinyl.currency, Currency.USD);
    });

    it('should update a vinyl', async () => {
        const vinyl: Vinyl = {
            id: 'v1',
            name: 'Old Name',
            authorName: 'Old Author',
            description: 'Old Description',
            priceCents: 1000,
            currency: Currency.USD,
        } as Vinyl;
        vinyls.push(vinyl);

        const updated = await service.update('v1', {
            name: 'Updated Name',
            priceCents: 1200,
        });
        assert.strictEqual(updated.name, 'Updated Name');
        assert.strictEqual(updated.priceCents, 1200);
    });

    it('should throw BadRequestException if update has no valid fields', async () => {
        const vinyl: Vinyl = {
            id: 'v1',
            name: 'Test',
            authorName: 'Author',
            description: 'Description',
            priceCents: 1000,
            currency: Currency.USD,
        } as Vinyl;
        vinyls.push(vinyl);

        let caught: unknown = null;
        try {
            await service.update('v1', {});
        } catch (err) {
            caught = err;
        }

        assert.ok(caught);
        assert.strictEqual(
            (caught as Error).constructor.name,
            'BadRequestException'
        );
    });

    it('should throw NotFoundException if vinyl not found on update', async () => {
        let caught: unknown = null;
        try {
            await service.update('non-existing', { name: 'X' });
        } catch (err) {
            caught = err;
        }

        assert.ok(caught);
        assert.strictEqual(
            (caught as Error).constructor.name,
            'NotFoundException'
        );
    });

    it('should upload vinyl image and update vinyl', async () => {
        const vinyl: Vinyl = {
            id: 'v1',
            name: 'Vinyl',
            authorName: 'Author',
            description: 'Description',
            priceCents: 1000,
            currency: Currency.USD,
        } as Vinyl;
        vinyls.push(vinyl);

        const file: Express.Multer.File = {
            originalname: 'img.jpg',
            buffer: Buffer.from(''),
            size: 0,
            fieldname: '',
            encoding: '',
            mimetype: '',
            destination: '',
            filename: '',
            path: '',
            stream: null!,
        };

        const result = await service.uploadVinylImage('v1', file);
        assert.ok(result.imageUrl);
        assert.strictEqual(result.imageUrl, 'https://fake.com/vinyls/v1.jpg');
    });

    it('should throw NotFoundException if uploading image for non-existing vinyl', async () => {
        let caught: unknown = null;
        try {
            const file: Express.Multer.File = {
                originalname: 'img.jpg',
                buffer: Buffer.from(''),
                size: 0,
                fieldname: '',
                encoding: '',
                mimetype: '',
                destination: '',
                filename: '',
                path: '',
                stream: null!,
            };
            await service.uploadVinylImage('non-existing', file);
        } catch (err) {
            caught = err;
        }

        assert.ok(caught);
        assert.strictEqual(
            (caught as Error).constructor.name,
            'NotFoundException'
        );
    });

    it('should delete vinyl and its image if S3 URL exists', async () => {
        const vinyl: Vinyl = {
            id: 'v1',
            name: 'Vinyl',
            authorName: 'Author',
            description: 'Description',
            priceCents: 1000,
            currency: Currency.USD,
            imageUrl: 'https://s3.test-bucket.com/vinyls/v1.jpg',
        } as Vinyl;
        vinyls.push(vinyl);

        await service.delete('v1');
        assert.strictEqual(vinyls.length, 0);
    });

    it('should throw NotFoundException when deleting non-existing vinyl', async () => {
        let caught: unknown = null;
        try {
            await service.delete('non-existing');
        } catch (err) {
            caught = err;
        }

        assert.ok(caught);
        assert.strictEqual(
            (caught as Error).constructor.name,
            'NotFoundException'
        );
    });
});
