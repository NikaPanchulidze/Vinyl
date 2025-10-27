import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { SystemLog } from './system-log.entity';
import { QueryLogsDto } from './dtos/query-logs.dto';
import { InjectDataSource } from '@nestjs/typeorm';

@Injectable()
export class SystemLogsRepository {
    private repo: Repository<SystemLog>;

    constructor(@InjectDataSource() private dataSource: DataSource) {
        this.repo = this.dataSource.getRepository(SystemLog);
    }

    public async getAll(query: QueryLogsDto): Promise<{
        logs: SystemLog[];
        total: number;
        page: number;
        limit: number;
        lastPage: number;
    }> {
        const qb = this.repo.createQueryBuilder('log');

        // Apply filters
        if (query.userId) {
            qb.andWhere('log.userId = :userId', { userId: query.userId });
        }
        if (query.entity) {
            qb.andWhere('log.entity = :entity', { entity: query.entity });
        }
        if (query.action) {
            qb.andWhere('log.action = :action', { action: query.action });
        }
        if (query.startDate) {
            qb.andWhere('log.createdAt >= :startDate', {
                startDate: new Date(query.startDate),
            });
        }

        // Get total count before pagination
        const total = await qb.getCount();

        // Apply sorting and pagination
        const page = query.page || 1;
        const limit = query.limit || 10;
        const sortOrder = query.sortOrder || 'DESC';

        qb.orderBy('log.createdAt', sortOrder)
            .skip((page - 1) * limit)
            .take(limit);

        const logs = await qb.getMany();

        return {
            logs,
            total,
            page,
            limit,
            lastPage: Math.ceil(total / limit),
        };
    }

    public async create(data: Partial<SystemLog>) {
        const log = this.repo.create(data);
        return this.repo.save(log);
    }

    public async log(message: string): Promise<SystemLog> {
        const log = this.repo.create({
            description: message,
            action: 'INFO',
            entity: 'System',
            duration: 0,
        });
        return this.repo.save(log);
    }
}
