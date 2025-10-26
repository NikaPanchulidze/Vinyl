import { Injectable } from '@nestjs/common';
import nodemailer from 'nodemailer';
import { EmailOptions } from './types/email-options';
import { SystemLogsService } from 'src/system-logs/system-logs.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
    private transporter;

    constructor(
        private readonly systemLogsService: SystemLogsService,
        private readonly configService: ConfigService
    ) {
        const isTest =
            process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'e2e';

        const service = isTest
            ? process.env.TEST_EMAIL_SERVICE || 'test'
            : this.configService.get<string>('EMAIL_SERVICE');

        const host = isTest
            ? process.env.TEST_EMAIL_HOST || 'localhost'
            : this.configService.get<string>('EMAIL_HOST');

        const port = isTest
            ? Number(process.env.TEST_EMAIL_PORT) || 587
            : Number(this.configService.get<string>('EMAIL_PORT'));

        const user = isTest
            ? process.env.TEST_EMAIL_USER || 'test-user'
            : this.configService.get<string>('EMAIL_USER');

        const pass = isTest
            ? process.env.TEST_EMAIL_PASS || 'test-pass'
            : this.configService.get<string>('EMAIL_PASS');

        this.transporter = nodemailer.createTransport({
            service,
            host,
            port,
            secure: true,
            auth: {
                user,
                pass,
            },
        });
    }

    public async sendMail({
        to,
        subject,
        text,
        html,
    }: EmailOptions): Promise<void> {
        try {
            await this.transporter.sendMail({
                from: this.configService.get<string>('EMAIL_USER'),
                to,
                subject,
                text,
                html,
            });
        } catch (err) {
            void this.systemLogsService.log(
                `Failed to send email to ${to}: ${err}`
            );
        }
    }
}
