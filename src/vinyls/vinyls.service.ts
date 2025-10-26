import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { VinylsRepository } from './vinyls.repository';
import { CreateVinylDto } from './dtos/create-vinyl.dto';
import { Vinyl } from './vinyl.entity';
import { FileService } from 'src/file/file.service';
import { VinylResponseDto } from './dtos/vinyl-response.dto';
import { VinylQueryDto } from './dtos/query-params.dto';
import { EventBusService } from 'src/eventBus/eventBus.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class VinylsService {
    constructor(
        private readonly vinylsRepo: VinylsRepository,
        private readonly fileService: FileService,
        private readonly eventBus: EventBusService,
        private readonly configService: ConfigService
    ) {}

    public async findAll(
        query: VinylQueryDto,
        userId?: string
    ): Promise<{
        vinyls: VinylResponseDto[];
        total: number;
        page: number;
        lastPage: number;
    }> {
        return this.vinylsRepo.findAll(query, userId);
    }

    public async findById(id: string): Promise<Vinyl | null> {
        return this.vinylsRepo.findById(id);
    }

    public async findByDiscogsId(discogsId: number): Promise<Vinyl | null> {
        return this.vinylsRepo.findByDiscogsId(discogsId);
    }

    public async create(body: CreateVinylDto): Promise<Vinyl> {
        const vinyl = await this.vinylsRepo.create(body);
        this.eventBus.emit('VinylCreated', vinyl.name, vinyl.priceCents);
        return vinyl;
    }

    public async update(id: string, attrs: Partial<Vinyl>): Promise<Vinyl> {
        if (
            !attrs.name &&
            !attrs.authorName &&
            !attrs.description &&
            !attrs.priceCents &&
            !attrs.currency
        ) {
            throw new BadRequestException(
                'You must provide at least name or authorName or description or priceCents or currency to update vinyl'
            );
        }
        const vinyl = await this.findById(id);
        if (!vinyl) {
            throw new NotFoundException('Vinyl not found!');
        }

        return this.vinylsRepo.update(vinyl, attrs);
    }

    public async uploadVinylImage(
        id: string,
        file: Express.Multer.File
    ): Promise<Vinyl> {
        const vinyl = await this.findById(id);
        if (!vinyl) {
            throw new NotFoundException('Vinyl not found!');
        }

        const imageUrl = await this.fileService.uploadImage(file, 'vinyls', id);
        return this.vinylsRepo.update(vinyl, { imageUrl });
    }

    public async delete(id: string): Promise<void> {
        const vinyl = await this.findById(id);
        if (!vinyl) {
            throw new NotFoundException('Vinyl not found!');
        }

        if (
            vinyl.imageUrl?.includes(
                String(this.configService.get<string>('S3_BUCKET_NAME'))
            )
        ) {
            await this.fileService.deleteFile(`vinyls/${id}`);
        }
        await this.vinylsRepo.delete(id);
    }
}
