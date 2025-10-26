import { Order } from 'src/orders/order.enitity';
import { Vinyl } from 'src/vinyls/vinyl.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity('order_items')
export class OrderItem {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Order, (order) => order.items, { onDelete: 'CASCADE' })
    order: Order;

    @ManyToOne(() => Vinyl, { eager: true, onDelete: 'SET NULL' })
    vinyl: Vinyl;

    @Column({ type: 'int' })
    priceCents: number;
}
