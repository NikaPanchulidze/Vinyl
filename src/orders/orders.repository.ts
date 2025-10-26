import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Order } from './order.enitity';
import { User } from 'src/users/user.entity';
import { Role } from 'src/users/types/roles.enum';
import { InjectDataSource } from '@nestjs/typeorm';

@Injectable()
export class OrdersRepository {
    private repo: Repository<Order>;

    constructor(@InjectDataSource() private dataSource: DataSource) {
        this.repo = this.dataSource.getRepository(Order);
    }

    public async create(order: Partial<Order>): Promise<Order> {
        const newOrder = this.repo.create(order);
        return this.repo.save(newOrder);
    }

    public async findByUser(user: User): Promise<Order[]> {
        if (user.role === Role.ADMIN) {
            return this.repo.find({
                relations: ['items', 'items.vinyl'],
                order: { createdAt: 'DESC' },
            });
        }

        return this.repo.find({
            where: { user: { id: user.id } },
            relations: ['items', 'items.vinyl'],
            order: { createdAt: 'DESC' },
        });
    }

    public async findOneByUser(
        orderId: string,
        userId: string
    ): Promise<Order | null> {
        return this.repo.findOne({
            where: { id: orderId, user: { id: userId } },
            relations: ['items', 'items.vinyl'],
        });
    }

    public async findOne(orderId: string): Promise<Order | null> {
        return this.repo.findOne({
            where: { id: orderId },
            relations: ['items', 'items.vinyl', 'user'],
        });
    }

    public async update(order: Order, attrs: Partial<Order>): Promise<Order> {
        Object.assign(order, attrs);
        return this.repo.save(order);
    }
}
