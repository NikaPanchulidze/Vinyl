import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { User } from './user.entity';
import { validateBirthDateRange } from 'src/utils/date-range-check.util';
import { FileService } from 'src/file/file.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UsersService {
    constructor(
        private readonly usersRepo: UsersRepository,
        private readonly fileService: FileService,
        private readonly configService: ConfigService
    ) {}

    public async findOneByEmail(email: string): Promise<User | null> {
        return this.usersRepo.findOneByEmail(email);
    }

    public async findOneById(id: string): Promise<User | null> {
        return this.usersRepo.findOneById(id);
    }

    public async create(
        email: string,
        hashedPassword: string,
        firstName: string,
        lastName: string,
        birthDate?: Date,
        provider?: string,
        providerId?: string,
        avatarUrl?: string
    ): Promise<User> {
        if (birthDate) {
            validateBirthDateRange(birthDate);
        }

        return this.usersRepo.create(
            email,
            hashedPassword,
            firstName,
            lastName,
            birthDate,
            provider,
            providerId,
            avatarUrl
        );
    }

    public async update(id: string, attrs: Partial<User>): Promise<User> {
        if (
            !attrs.firstName &&
            !attrs.lastName &&
            !attrs.birthDate &&
            !attrs.avatarUrl
        ) {
            throw new BadRequestException(
                'You must provide at least firstName or lastName or birthDate to update user'
            );
        }

        if (attrs.birthDate) {
            validateBirthDateRange(attrs.birthDate);
        }

        const user = await this.usersRepo.findOneById(id);
        if (!user) throw new NotFoundException('User not found!');

        return this.usersRepo.update(user, attrs);
    }

    public async uploadAvatar(
        userId: string,
        file: Express.Multer.File
    ): Promise<User> {
        const user = await this.usersRepo.findOneById(userId);
        if (!user) throw new NotFoundException('User not found!');

        const avatarUrl = await this.fileService.uploadImage(
            file,
            'avatars',
            user.id
        );
        return this.usersRepo.update(user, { avatarUrl });
    }

    public async delete(id: string): Promise<void> {
        const user = await this.usersRepo.findOneById(id);
        if (!user) throw new NotFoundException('User not found!');

        if (
            user.avatarUrl?.includes(
                String(this.configService.get<string>('S3_BUCKET_NAME'))
            )
        ) {
            await this.fileService.deleteFile(`avatars/${user.id}`);
        }
        await this.usersRepo.delete(user.id);
    }
}
