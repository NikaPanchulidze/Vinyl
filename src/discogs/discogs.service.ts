import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { VinylsService } from 'src/vinyls/vinyls.service';
import { ConfigService } from '@nestjs/config';
import { Vinyl } from 'src/vinyls/vinyl.entity';
import { SearchDiscogDto } from './dtos/search-discog.dto';

interface DiscogsSearchResult {
    id: number;
    title: string;
    label: string[];
    cover_image: string;
}

@Injectable()
export class DiscogsService {
    constructor(
        private readonly http: HttpService,
        private readonly config: ConfigService,
        private readonly vinylsService: VinylsService
    ) {}

    private get baseUrl(): string {
        return this.config.get('DISCOGS_BASE_URL')!;
    }

    private get token(): string {
        return this.config.get('DISCOGS_TOKEN')!;
    }

    public async searchVinyls(query: SearchDiscogDto): Promise<Vinyl[]> {
        const url = `${this.baseUrl}/database/search?q=${encodeURIComponent(query.q)}&token=${this.token}&type=release&per_page=${query.limit}&page=${query.page}`;
        const { data } = await lastValueFrom(this.http.get(url));

        return data.results.map((item: DiscogsSearchResult) => ({
            discogsId: item.id,
            title: item.title,
            authorName: item.label[0] || 'Unknown',
            imageUrl: item.cover_image,
        })) as Vinyl[];
    }

    public async getVinylDetails(id: number): Promise<Partial<Vinyl>> {
        const url = `${this.baseUrl}/releases/${id}?token=${this.token}`;
        try {
            const { data } = await lastValueFrom(this.http.get(url));

            return {
                discogsId: data.id,
                name: data.title,
                authorName: data.artists_sort,
                description: data.notes || 'No description available.',
                imageUrl: data.images?.[0]?.uri || null,
                discogsScore: data.community?.rating?.average || 0,
            };
        } catch (error) {
            throw new NotFoundException(
                `Discogs record with ID ${id} not found`
            );
        }
    }

    public async addVinylFromDiscogs(
        id: number,
        priceCents: number
    ): Promise<Vinyl> {
        const details = await this.getVinylDetails(id);

        // Check if it already exists
        const existing = await this.vinylsService.findByDiscogsId(
            Number(details.discogsId)
        );
        if (existing)
            throw new BadRequestException('Discogs ID already exists');

        return this.vinylsService.create({
            name: details.name || 'Unknown',
            authorName: details.authorName || 'Unknown',
            description: details.description || 'No description available.',
            imageUrl: details.imageUrl,
            priceCents,
            discogsScore: details.discogsScore,
            discogsId: details.discogsId,
        });
    }
}
