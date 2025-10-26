import { SystemLog } from '../system-log.entity';

export class LogsResponseDto {
    logs: SystemLog[];
    total: number;
    page: number;
    limit: number;
    lastPage: number;
}
