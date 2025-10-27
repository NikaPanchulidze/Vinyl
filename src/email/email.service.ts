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
        this.transporter = nodemailer.createTransport({
            service: process.env.EMAIL_SERVICE,
            host: process.env.EMAIL_HOST,
            port: Number(process.env.EMAIL_PORT),
            secure: false,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
            tls: {
                rejectUnauthorized: false, // Accept self-signed certificates
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
                from: process.env.EMAIL_USER,
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
