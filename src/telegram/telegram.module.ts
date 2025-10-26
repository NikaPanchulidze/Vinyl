import { Module } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { SystemLogsModule } from 'src/system-logs/system-logs.module';

@Module({
    imports: [SystemLogsModule],
    providers: [TelegramService],
    exports: [TelegramService],
})
export class TelegramModule {}
