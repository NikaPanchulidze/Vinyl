import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SystemLog } from './system-log.entity';
import { Repository } from 'typeorm';
import { QueryLogsDto } from './dtos/query-logs.dto';
import { SystemLogsRepository } from './system-logs.repository';

@Injectable()
export class SystemLogsService {
    constructor(private readonly logRepo: SystemLogsRepository) {}

    public async getAll(query: QueryLogsDto): Promise<{
        logs: SystemLog[];
        total: number;
        page: number;
        limit: number;
        lastPage: number;
    }> {
        return this.logRepo.getAll(query);
    }

    public async create(data: Partial<SystemLog>) {
        return this.logRepo.create(data);
    }

    public async log(message: string): Promise<SystemLog> {
        return this.logRepo.log(message);
    }
}
