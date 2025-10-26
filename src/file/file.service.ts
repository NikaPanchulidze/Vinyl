import {
    DeleteObjectCommand,
    PutObjectCommand,
    S3Client,
} from '@aws-sdk/client-s3';
import {
    BadRequestException,
    Injectable,
    InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class FileService {
    private s3: S3Client;

    constructor(private readonly configService: ConfigService) {
        const isTest =
            process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'e2e';
        const accessKeyId = isTest
            ? process.env.AWS_ACCESS_KEY_ID || 'test-access-key'
            : configService.get<string>('AWS_ACCESS_KEY_ID') ||
              'default_access_key';

        const secretAccessKey = isTest
            ? process.env.AWS_SECRET_ACCESS_KEY || 'test-secret-key'
            : configService.get<string>('AWS_SECRET_ACCESS_KEY') ||
              'default_secret_key';

        const region = isTest
            ? process.env.AWS_REGION || 'us-east-1'
            : configService.get<string>('AWS_REGION') || 'default_region';

        this.s3 = new S3Client({
            region,
            credentials: {
                accessKeyId,
                secretAccessKey,
            },
        });
    }

    private readonly allowedMimeTypes = [
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/gif',
    ];
    private readonly allowedExtensions = /\.(jpg|jpeg|png|gif|webp)$/i;
    private readonly maxFileSize = 5 * 1024 * 1024; // 5MB

    public async uploadImage(
        file: Express.Multer.File,
        keyPrefix: string,
        uniqueId: string
    ): Promise<string> {
        if (!file) {
            throw new BadRequestException('No file uploaded.');
        }

        // Validate file size
        if (file.size > this.maxFileSize) {
            throw new BadRequestException('File too large. Max size is 5MB.');
        }

        // Validate extension
        if (!this.allowedExtensions.test(file.originalname)) {
            throw new BadRequestException(
                'Invalid file extension. Only images are allowed.'
            );
        }

        // Validate MIME type
        if (!this.allowedMimeTypes.includes(file.mimetype)) {
            throw new BadRequestException(
                'Invalid file type. Only JPEG, PNG, WEBP, and GIF allowed.'
            );
        }

        const key = `${keyPrefix}/${uniqueId}`;

        try {
            await this.s3.send(
                new PutObjectCommand({
                    Bucket: this.configService.get<string>('S3_BUCKET_NAME')!,
                    Key: key,
                    Body: file.buffer,
                    ContentType: file.mimetype,
                })
            );

            // Return public URL
            return `https://${this.configService.get<string>('S3_BUCKET_NAME')}.s3.${this.configService.get<string>('AWS_REGION')}.amazonaws.com/${key}`;
        } catch (error) {
            throw new InternalServerErrorException(
                'Failed to upload file to S3'
            );
        }
    }

    public async deleteFile(key: string): Promise<void> {
        if (!key) return;

        try {
            await this.s3.send(
                new DeleteObjectCommand({
                    Bucket: this.configService.get<string>('S3_BUCKET_NAME')!,
                    Key: key,
                })
            );
        } catch (error) {
            throw new InternalServerErrorException(
                'Failed to delete file from S3'
            );
        }
    }
}
