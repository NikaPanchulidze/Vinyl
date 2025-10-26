import { Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_PIPE } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminModule } from './admin/admin.module';
import { AuthModule } from './auth/auth.module';
import { EmailModule } from './email/email.module';
import { EventBusModule } from './eventBus/eventBus.module';
import { FileModule } from './file/file.module';
import { OrdersModule } from './orders/orders.module';
import { AppDataSource } from './ormconfig';
import { TestDataSource } from './ormconfig.test';
import { PaymentModule } from './payment/payment.module';
import { ReviewsModule } from './reviews/reviews.module';
import { SystemLogsModule } from './system-logs/system-logs.module';
import { UsersModule } from './users/users.module';
import { VinylsModule } from './vinyls/vinyls.module';
import { DiscogsModule } from './discogs/discogs.module';
import { TelegramModule } from './telegram/telegram.module';
import { ProdDataSource } from './ormconfig.prod';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: [`.env.${process.env.NODE_ENV}`, '.env'],
        }),
        TypeOrmModule.forRootAsync({
            useFactory: async () => {
                const isTestEnv =
                    process.env.NODE_ENV === 'test' ||
                    process.env.NODE_ENV === 'e2e';

                let dataSource = isTestEnv ? TestDataSource : AppDataSource;

                if (process.env.NODE_ENV === 'production') {
                    dataSource = ProdDataSource;
                }

                if (!dataSource.isInitialized) {
                    await dataSource.initialize();
                }

                return {
                    ...dataSource.options,
                    autoLoadEntities: true,
                };
            },
        }),
        AuthModule,
        UsersModule,
        VinylsModule,
        ReviewsModule,
        OrdersModule,
        EmailModule,
        AdminModule,
        SystemLogsModule,
        FileModule,
        PaymentModule,
        EventBusModule,
        DiscogsModule,
        TelegramModule,
    ],
    controllers: [],
    providers: [
        {
            provide: APP_PIPE,
            useValue: new ValidationPipe({
                whitelist: true,
                transform: true,
            }),
        },
    ],
})
export class AppModule {}
