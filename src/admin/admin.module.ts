import { Module } from '@nestjs/common';
import { DiscogsModule } from 'src/discogs/discogs.module';
import { FileModule } from 'src/file/file.module';
import { ReviewsModule } from 'src/reviews/reviews.module';
import { SystemLogsModule } from 'src/system-logs/system-logs.module';
import { VinylsModule } from 'src/vinyls/vinyls.module';
import { AdminDiscogsController } from './controllers/admin-discogs.controller';
import { AdminReviewsController } from './controllers/admin-reviews.controller';
import { AdminLogsController } from './controllers/admin-system-logs.controller';
import { AdminVinylsController } from './controllers/admin-vinyls.controller';

@Module({
    imports: [
        VinylsModule,
        FileModule,
        ReviewsModule,
        SystemLogsModule,
        DiscogsModule,
    ],
    controllers: [
        AdminVinylsController,
        AdminReviewsController,
        AdminLogsController,
        AdminDiscogsController,
    ],
    providers: [],
    exports: [],
})
export class AdminModule {}
