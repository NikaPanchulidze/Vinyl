import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { User } from './user.entity';
import { InjectDataSource } from '@nestjs/typeorm';

@Injectable()
export class UsersRepository {
    private repo: Repository<User>;

    constructor(@InjectDataSource() private dataSource: DataSource) {
        this.repo = this.dataSource.getRepository(User);
    }

    public async findOneByEmail(email: string): Promise<User | null> {
        return this.repo.findOne({ where: { email } });
    }

    public async findOneById(id: string): Promise<User | null> {
        return this.repo.findOne({ where: { id } });
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
        const newUser = this.repo.create({
            email,
            password: hashedPassword,
            firstName,
            lastName,
            birthDate,
            provider,
            providerId,
            avatarUrl,
        });
        return this.repo.save(newUser);
    }

    public async update(user: User, attrs: Partial<User>): Promise<User> {
        if (attrs.firstName) user.firstName = attrs.firstName;
        if (attrs.lastName) user.lastName = attrs.lastName;
        if (attrs.birthDate) user.birthDate = attrs.birthDate;
        if (attrs.avatarUrl) user.avatarUrl = attrs.avatarUrl;

        return this.repo.save(user);
    }

    public async delete(id: string): Promise<void> {
        return this.repo.delete(id) as unknown as Promise<void>;
    }
}
