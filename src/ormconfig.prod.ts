import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import { join } from 'path';
import { User } from './users/user.entity';
import { SystemLog } from './system-logs/system-log.entity';
import { Vinyl } from './vinyls/vinyl.entity';
import { Order } from './orders/order.enitity';
import { OrderItem } from './orders/order-item.entity';
import { Review } from './reviews/review.enitity';

dotenv.config();

export const ProdDataSource = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL + '?sslmode=require',
    entities: [User, Vinyl, Order, OrderItem, Review, SystemLog],
    migrations: [join(__dirname, '/../migrations/*.{ts,js}')],
    synchronize: false,
    logging: false,
    ssl: {
        rejectUnauthorized: false,
    },
});
