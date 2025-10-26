/* eslint-disable @typescript-eslint/no-floating-promises */
import * as assert from 'node:assert';
import { beforeEach, describe, it } from 'node:test';
import { EmailService } from './email.service';
import { ConfigService } from '@nestjs/config';

class FakeTransporter {
    public sent: any[] = [];
    sendMail(mail: any) {
        this.sent.push(mail);
        return Promise.resolve();
    }
}

class FakeSystemLogsService {
    public logs: string[] = [];
    log(message: string) {
        this.logs.push(message);
        return Promise.resolve();
    }
}

describe('EmailService (with fake info)', () => {
    let emailService: EmailService;
    let fakeTransporter: FakeTransporter;
    let fakeLogs: FakeSystemLogsService;
    let fakeConfig: ConfigService;

    beforeEach(() => {
        fakeLogs = new FakeSystemLogsService();

        fakeConfig = {
            get: (key: string) => {
                switch (key) {
                    case 'EMAIL_SERVICE':
                        return 'gmail';
                    case 'EMAIL_HOST':
                        return 'smtp.fakehost.com';
                    case 'EMAIL_PORT':
                        return '465';
                    case 'EMAIL_USER':
                        return 'fakeuser@fake.com';
                    case 'EMAIL_PASS':
                        return 'fakepassword';
                    default:
                        return undefined;
                }
            },
        } as unknown as ConfigService;

        // @ts-expect-error -- ignoring private constructor param type
        emailService = new EmailService(fakeLogs, fakeConfig);

        fakeTransporter = new FakeTransporter();
        // @ts-expect-error -- ignoring private property access
        emailService['transporter'] = fakeTransporter;
    });

    it('should "send" an email using fake transporter', async () => {
        const emailOptions = {
            to: 'someone@fake.com',
            subject: 'Fake Test',
            text: 'Hello Fake!',
            html: '<p>Hello Fake!</p>',
        };

        await emailService.sendMail(emailOptions);

        assert.strictEqual(fakeTransporter.sent.length, 1);
        assert.strictEqual(fakeTransporter.sent[0].to, 'someone@fake.com');
        assert.strictEqual(fakeTransporter.sent[0].subject, 'Fake Test');
    });

    it('should log error if sending fails (simulated)', async () => {
        fakeTransporter.sendMail = () =>
            Promise.reject(new Error('SMTP Failure'));

        await emailService.sendMail({
            to: 'fail@fake.com',
            subject: 'Fail Fake',
            text: 'Error!',
            html: '<p>Error!</p>',
        });

        assert.strictEqual(fakeLogs.logs.length, 1);
        assert.ok(
            fakeLogs.logs[0].includes('Failed to send email to fail@fake.com')
        );
        assert.ok(fakeLogs.logs[0].includes('SMTP Failure'));
    });
});
