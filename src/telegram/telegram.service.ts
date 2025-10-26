import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { SystemLogsService } from 'src/system-logs/system-logs.service';

@Injectable()
export class TelegramService {
    private readonly telegramApiUrl: string;
    private readonly chatId: string;

    constructor(
        private readonly systemLogsService: SystemLogsService,
        private readonly configService: ConfigService
    ) {
        const isTest =
            process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'e2e';

        const botToken = isTest
            ? process.env.TELEGRAM_BOT_TOKEN || 'test-bot-token'
            : this.configService.get<string>('TELEGRAM_BOT_TOKEN');

        const chatId = isTest
            ? process.env.TELEGRAM_CHAT_ID || 'test-chat-id'
            : this.configService.get<string>('TELEGRAM_CHAT_ID');

        this.telegramApiUrl = `https://api.telegram.org/bot${botToken}`;
        this.chatId = chatId!;
    }

    public async sendMessage(message: string): Promise<void> {
        try {
            await axios.post(`${this.telegramApiUrl}/sendMessage`, {
                chat_id: this.chatId,
                text: message,
                parse_mode: 'HTML',
            });
        } catch (error) {
            void this.systemLogsService.log(
                `Error sending message to Telegram: ${error}`
            );
        }
    }
}
