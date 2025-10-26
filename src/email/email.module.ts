import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { SystemLogsModule } from 'src/system-logs/system-logs.module';

@Module({
    imports: [SystemLogsModule],
    providers: [EmailService],
    exports: [EmailService],
})
export class EmailModule {}
