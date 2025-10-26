import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { VinylsModule } from 'src/vinyls/vinyls.module';
import { DiscogsService } from './discogs.service';

@Module({
    imports: [HttpModule, VinylsModule],
    controllers: [],
    providers: [DiscogsService, ConfigService],
    exports: [DiscogsService],
})
export class DiscogsModule {}
