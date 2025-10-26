import { Module } from '@nestjs/common';
import { SystemLogsService } from './system-logs.service';
import { SystemLog } from './system-log.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ActivityLoggerInterceptor } from 'src/interceptors/logger.interceptor';
import { SystemLogsRepository } from './system-logs.repository';

@Module({
    imports: [TypeOrmModule.forFeature([SystemLog])],
    providers: [
        SystemLogsService,
        {
            provide: APP_INTERCEPTOR,
            useClass: ActivityLoggerInterceptor,
        },
        SystemLogsRepository,
    ],
    controllers: [],
    exports: [SystemLogsService],
})
export class SystemLogsModule {}
