import { Injectable, OnModuleInit } from '@nestjs/common';
import { TelegramService } from 'src/telegram/telegram.service';
import { EventBusService } from '../eventBus.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class VinylCreatedListener implements OnModuleInit {
    constructor(
        private readonly eventBus: EventBusService,
        private readonly telegramService: TelegramService,
        private readonly configService: ConfigService
    ) {}

    onModuleInit() {
        this.eventBus.on(
            'VinylCreated',
            (name: string, price: number): void => {
                const link = `${this.configService.get<string>('STORE_URL')}=${encodeURIComponent(
                    name
                )}`;
                void (() => {
                    const message = `<b>New Vinyl Added!</b>\n\n<b>Name:</b> ${name}\n<b>Price:</b> $${(price / 100).toFixed(2)}\n<b>Link:</b> ${link}`;

                    if (
                        this.configService.get<string>('NODE_ENV') === 'test' ||
                        this.configService.get<string>('NODE_ENV') === 'e2e'
                    )
                        return;

                    void this.telegramService.sendMessage(message);
                })();
            }
        );
    }
}
