/* eslint-disable @typescript-eslint/no-floating-promises */
import { DeleteObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import * as assert from 'node:assert';
import { beforeEach, describe, it } from 'node:test';
import { FileService } from './file.service';

class FakeS3Client {
    public sent: any[] = [];

    send(command: any) {
        this.sent.push(command);
        return Promise.resolve({});
    }
}

describe('FileService', () => {
    let fileService: FileService;
    let fakeConfig: ConfigService;
    let fakeS3: FakeS3Client;

    beforeEach(() => {
        fakeConfig = {
            get: (key: string) => {
                switch (key) {
                    case 'AWS_REGION':
                        return 'us-east-1';
                    case 'AWS_ACCESS_KEY_ID':
                        return 'fake-id';
                    case 'AWS_SECRET_ACCESS_KEY':
                        return 'fake-secret';
                    case 'S3_BUCKET_NAME':
                        return 'fake-bucket';
                }
                return undefined;
            },
        } as unknown as ConfigService;

        fileService = new FileService(fakeConfig);

        fakeS3 = new FakeS3Client();
        (fileService as any).s3 = fakeS3;
    });

    it('should upload a valid image and return URL', async () => {
        const file = {
            originalname: 'photo.png',
            mimetype: 'image/png',
            size: 1024,
            buffer: Buffer.from('data'),
        } as Express.Multer.File;

        const url = await fileService.uploadImage(file, 'uploads', '123');
        assert.ok(
            url.includes('fake-bucket.s3.us-east-1.amazonaws.com/uploads/123')
        );
        assert.ok(fakeS3.sent.length === 1);
        assert.ok(fakeS3.sent[0] instanceof PutObjectCommand);
    });

    it('should throw error for invalid MIME type', async () => {
        const file = {
            originalname: 'file.txt',
            mimetype: 'text/plain',
            size: 1024,
            buffer: Buffer.from('data'),
        } as Express.Multer.File;

        try {
            await fileService.uploadImage(file, 'uploads', '123');
            assert.fail('Expected BadRequestException');
        } catch (err: any) {
            assert.strictEqual(err.constructor.name, 'BadRequestException');
        }
    });

    it('should delete a file', async () => {
        await fileService.deleteFile('uploads/123');
        assert.ok(fakeS3.sent[0] instanceof DeleteObjectCommand);
    });
});
