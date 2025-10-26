import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { VinylResponseDto } from './dtos/vinyl-response.dto';
import { Vinyl } from './vinyl.entity';
import { VinylQueryDto } from './dtos/query-params.dto';
import { InjectDataSource } from '@nestjs/typeorm';

@Injectable()
export class VinylsRepository {
    private repo: Repository<Vinyl>;

    constructor(@InjectDataSource() private dataSource: DataSource) {
        this.repo = this.dataSource.getRepository(Vinyl);
    }

    public async findAll(
        query: VinylQueryDto,
        userId?: string
    ): Promise<{
        vinyls: VinylResponseDto[];
        total: number;
        page: number;
        lastPage: number;
    }> {
        const qb = this.repo
            .createQueryBuilder('vinyl')
            .leftJoin('vinyl.reviews', 'review')
            .leftJoin('review.user', 'reviewUser')
            .select([
                'vinyl.id as "id"',
                'vinyl.name as "name"',
                'vinyl.authorName as "authorName"',
                'vinyl.imageUrl as "imageUrl"',
                'vinyl.description as "description"',
                'vinyl.priceCents as "priceCents"',
                'vinyl.currency as "currency"',
                'vinyl.discogsId as "discogsId"',
                'vinyl.discogsScore as "discogsScore"',
                'vinyl.createdAt as "createdAt"',
            ])
            .addSelect('ROUND(AVG(review.rating), 2)', 'avgScore')
            .addSelect((subQuery) => {
                const sq = subQuery
                    .select('r.comment')
                    .from('reviews', 'r')
                    .where('r."vinylId" = vinyl.id');

                if (userId) {
                    sq.andWhere('r."userId" != :userId', { userId });
                }

                return sq.orderBy('r."createdAt"', 'ASC').limit(1);
            }, 'firstReview')
            // PostgreSQL requires all non-aggregated columns in GROUP BY
            .groupBy('vinyl.id')
            .addGroupBy('vinyl.name')
            .addGroupBy('vinyl.authorName')
            .addGroupBy('vinyl.imageUrl')
            .addGroupBy('vinyl.description')
            .addGroupBy('vinyl.priceCents')
            .addGroupBy('vinyl.currency')
            .addGroupBy('vinyl.discogsId')
            .addGroupBy('vinyl.discogsScore')
            .addGroupBy('vinyl.createdAt');

        // Search
        if (!userId) {
            query.search = undefined;
            query.sortBy = undefined;
            query.sortOrder = undefined;
        }

        if (query.search) {
            qb.andWhere(
                '(vinyl.name ILIKE :search OR vinyl.authorName ILIKE :search)',
                { search: `%${query.search}%` }
            );
        }

        // Get total count BEFORE pagination
        const countQb = qb.clone();
        const countResult = await countQb
            .select('COUNT(DISTINCT vinyl.id)', 'count')
            .groupBy('')
            .getRawOne();
        const total = parseInt(String(countResult?.count || '0'));

        // Sorting
        const validSortFields = ['priceCents', 'name', 'authorName'];
        const sortBy = validSortFields.includes(query.sortBy || '')
            ? query.sortBy
            : 'createdAt';
        const sortOrder = query.sortOrder === 'ASC' ? 'ASC' : 'DESC';
        qb.orderBy(`vinyl.${sortBy}`, sortOrder);

        // Pagination
        const page = query.page || 1;
        const limit = query.limit || 10;
        qb.offset((page - 1) * limit).limit(limit);

        // Execute query
        const items = await qb.getRawMany<VinylResponseDto>();

        return {
            vinyls: items,
            total,
            page,
            lastPage: Math.ceil(total / limit),
        };
    }

    public async findById(id: string): Promise<Vinyl | null> {
        return this.repo.findOne({ where: { id } });
    }

    public async findByDiscogsId(discogsId: number): Promise<Vinyl | null> {
        return this.repo.findOne({ where: { discogsId } });
    }

    public async create(body: Partial<Vinyl>): Promise<Vinyl> {
        const newVinyl = this.repo.create(body);
        return this.repo.save(newVinyl);
    }

    public async update(vinyl: Vinyl, attrs: Partial<Vinyl>): Promise<Vinyl> {
        if (attrs.name) vinyl.name = attrs.name;
        if (attrs.authorName) vinyl.authorName = attrs.authorName;
        if (attrs.description) vinyl.description = attrs.description;
        if (attrs.priceCents) vinyl.priceCents = attrs.priceCents;
        if (attrs.currency) vinyl.currency = attrs.currency;
        if (attrs.imageUrl) vinyl.imageUrl = attrs.imageUrl;

        return this.repo.save(vinyl);
    }

    public async delete(id: string): Promise<void> {
        return this.repo.delete(id) as unknown as Promise<void>;
    }
}
