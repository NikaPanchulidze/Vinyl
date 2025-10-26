import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileModule } from 'src/file/file.module';
import { Vinyl } from './vinyl.entity';
import { VinylsController } from './vinyls.controller';
import { VinylsRepository } from './vinyls.repository';
import { VinylsService } from './vinyls.service';
import { EventBusModule } from 'src/eventBus/eventBus.module';
import { VinylCreatedListener } from 'src/eventBus/listeners/vinylListeners';
import { TelegramModule } from 'src/telegram/telegram.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Vinyl]),
        FileModule,
        EventBusModule,
        TelegramModule,
    ],
    controllers: [VinylsController],
    providers: [VinylsService, VinylsRepository, VinylCreatedListener],
    exports: [VinylsService, VinylsRepository],
})
export class VinylsModule {}
