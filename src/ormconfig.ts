import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import { User } from './users/user.entity';
import { Vinyl } from './vinyls/vinyl.entity';
import { Order } from './orders/order.enitity';
import { OrderItem } from './orders/order-item.entity';
import { Review } from './reviews/review.enitity';
import { SystemLog } from './system-logs/system-log.entity';

dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

export const AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASS || 'password',
    database: process.env.DB_NAME || 'my_database',
    entities: [User, Vinyl, Order, OrderItem, Review, SystemLog],
    migrations: ['dist/src/migrations/*.js'],
    synchronize: false,
    logging: false,
});
