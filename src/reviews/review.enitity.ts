import { User } from 'src/users/user.entity';
import { Vinyl } from 'src/vinyls/vinyl.entity';
import {
    Column,
    CreateDateColumn,
    Entity,
    ManyToOne,
    PrimaryGeneratedColumn,
    Unique,
    UpdateDateColumn,
} from 'typeorm';

@Entity('reviews')
@Unique(['user', 'vinyl'])
export class Review {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'int', width: 1 })
    rating: number;

    @Column({ type: 'text' })
    comment: string;

    @ManyToOne(() => User, (user) => user.reviews, { onDelete: 'CASCADE' })
    user: User;

    @ManyToOne(() => Vinyl, (vinyl) => vinyl.reviews, { onDelete: 'CASCADE' })
    vinyl: Vinyl;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
