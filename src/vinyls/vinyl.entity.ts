import {
    Column,
    CreateDateColumn,
    Entity,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { Currency } from '../common/types/currency.enum';
import { Review } from 'src/reviews/review.enitity';

@Entity({ name: 'vinyls' })
export class Vinyl {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar', length: 100 })
    name: string;

    @Column({ type: 'varchar', length: 100 })
    authorName: string;

    @Column({ type: 'text' })
    description: string;

    @Column({ type: 'varchar', nullable: true })
    imageUrl?: string;

    @Column({ type: 'int' })
    priceCents: number;

    @Column({ type: 'enum', enum: Currency, default: Currency.USD })
    currency: Currency;

    @Column({ type: 'numeric', nullable: true })
    discogsId?: number;

    @Column({ type: 'float', nullable: true })
    discogsScore?: number;

    @OneToMany(() => Review, (review) => review.vinyl)
    reviews: Review[];

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
