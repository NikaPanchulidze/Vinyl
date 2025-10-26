import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
} from 'typeorm';

@Entity('system_logs')
export class SystemLog {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid', nullable: true })
    userId: string;

    @Column({ type: 'varchar', length: 255 })
    entity: string;

    @Column({ type: 'varchar', length: 255 })
    action: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ type: 'int', nullable: true })
    duration: number;

    @CreateDateColumn()
    createdAt: Date;
}
