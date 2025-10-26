import { Module } from '@nestjs/common';
import { EventBusService } from './eventBus.service';

@Module({
    providers: [EventBusService],
    exports: [EventBusService],
})
export class EventBusModule {}
