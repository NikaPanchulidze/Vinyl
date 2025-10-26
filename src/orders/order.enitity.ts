import { User } from 'src/users/user.entity';
import {
    Column,
    CreateDateColumn,
    Entity,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { Status } from './types/status.enum';
import { Currency } from 'src/common/types/currency.enum';
import { OrderItem } from 'src/orders/order-item.entity';

@Entity('orders')
export class Order {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => User, (user) => user.orders, { onDelete: 'SET NULL' })
    user: User;

    @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
    items: OrderItem[];

    @Column({ type: 'int' })
    totalAmountCents: number;

    @Column({ type: 'enum', enum: Currency })
    currency: Currency;

    @Column({
        type: 'enum',
        enum: Status,
        default: Status.PENDING,
    })
    status: Status;

    @Column({ type: 'varchar', nullable: true })
    stripeSessionId?: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
