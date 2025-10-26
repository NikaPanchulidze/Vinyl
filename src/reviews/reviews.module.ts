import { Module } from '@nestjs/common';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';
import { VinylsModule } from 'src/vinyls/vinyls.module';
import { OrdersModule } from 'src/orders/orders.module';
import { ReviewsRepository } from './reviews.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Review } from './review.enitity';

@Module({
    imports: [TypeOrmModule.forFeature([Review]), VinylsModule, OrdersModule],
    controllers: [ReviewsController],
    providers: [ReviewsService, ReviewsRepository],
    exports: [ReviewsService, ReviewsRepository],
})
export class ReviewsModule {}
