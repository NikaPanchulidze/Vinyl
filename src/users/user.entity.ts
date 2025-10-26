import {
    Column,
    CreateDateColumn,
    Entity,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { Role } from './types/roles.enum';
import { Order } from 'src/orders/order.enitity';
import { Review } from 'src/reviews/review.enitity';

@Entity({ name: 'users' })
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar', length: 50 })
    firstName: string;

    @Column({ type: 'varchar', length: 50 })
    lastName: string;

    @Column({ type: 'varchar', unique: true })
    email: string;

    @Column({ type: 'date', nullable: true })
    birthDate?: Date;

    @Column({ type: 'varchar', nullable: true })
    avatarUrl?: string;

    @Column({ type: 'varchar' })
    password: string;

    @Column({ type: 'varchar', default: 'local' })
    provider?: string;

    @Column({ type: 'varchar', nullable: true })
    providerId?: string;

    @Column({ type: 'enum', enum: Role, default: Role.USER })
    role: Role;

    @OneToMany(() => Order, (order) => order.user)
    orders: Order[];

    @OneToMany(() => Review, (review) => review.user)
    reviews: Review[];

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
