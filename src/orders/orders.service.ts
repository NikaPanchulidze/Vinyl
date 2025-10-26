import {
    forwardRef,
    Inject,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { PaymentService } from 'src/payment/payment.service';
import { User } from 'src/users/user.entity';
import { VinylsService } from 'src/vinyls/vinyls.service';
import { CreateOrderDto } from './dtos/create-order.dto';
import { OrderItem } from './order-item.entity';
import { Order } from './order.enitity';
import { OrdersRepository } from './orders.repository';
import { Status } from './types/status.enum';

@Injectable()
export class OrdersService {
    constructor(
        private readonly ordersRepo: OrdersRepository,
        private readonly vinylsService: VinylsService,
        @Inject(forwardRef(() => PaymentService))
        private readonly paymentsService: PaymentService
    ) {}

    // Create order
    public async create(
        userId: string,
        body: CreateOrderDto
    ): Promise<{ url: string }> {
        const uniqueVinylIds = [...new Set(body.vinylIds)];

        const vinyls = await Promise.all(
            uniqueVinylIds.map(async (id) => {
                try {
                    return await this.vinylsService.findById(id);
                } catch {
                    return null;
                }
            })
        );

        if (vinyls.some((v) => !v)) {
            throw new NotFoundException('One or more vinyls not found');
        }

        const items = vinyls.map((v) => {
            const item = new OrderItem();
            item.vinyl = v!;
            item.priceCents = v!.priceCents;
            return item;
        });

        const totalAmountCents = items.reduce(
            (sum: number, item: OrderItem) => sum + item.priceCents,
            0
        );

        const order = await this.ordersRepo.create({
            user: { id: userId } as User,
            items,
            totalAmountCents,
            currency: vinyls[0]!.currency,
            status: Status.PENDING,
        });

        const { url } = await this.paymentsService.createCheckoutSession(order);

        if (!url) {
            throw new Error('Failed to create checkout session');
        }

        return {
            url,
        };
    }

    public async updateSessionId(
        orderId: string,
        sessionId: string,
        userId: string
    ): Promise<Order> {
        const order = await this.ordersRepo.findOneByUser(orderId, userId);
        if (!order) {
            throw new NotFoundException('Order not found');
        }
        order.stripeSessionId = sessionId;
        return this.ordersRepo.update(order, {});
    }

    public async markAsPaid(orderId: string): Promise<Order> {
        const order = await this.ordersRepo.findOne(orderId);
        if (!order) {
            throw new NotFoundException('Order not found');
        }
        order.status = Status.PAID;
        return this.ordersRepo.update(order, {});
    }

    public async markAsFailed(orderId: string): Promise<Order> {
        const order = await this.ordersRepo.findOne(orderId);
        if (!order) {
            throw new NotFoundException('Order not found');
        }
        order.status = Status.FAILED;
        return this.ordersRepo.update(order, {});
    }

    // Get user orders
    public async findByUser(user: User): Promise<Order[]> {
        return this.ordersRepo.findByUser(user);
    }

    public async findOneByUser(
        orderId: string,
        userId: string
    ): Promise<Order | null> {
        return this.ordersRepo.findOneByUser(orderId, userId);
    }

    public async findOne(orderId: string): Promise<Order | null> {
        return this.ordersRepo.findOne(orderId);
    }

    public async hasPurchasedVinyl(
        userId: string,
        vinylId: string
    ): Promise<boolean> {
        const orders = await this.ordersRepo.findByUser({ id: userId } as User);

        for (const order of orders) {
            if (order.status !== Status.PAID) continue;

            for (const item of order.items) {
                if (item?.vinyl?.id === vinylId) {
                    return true;
                }
            }
        }

        return false;
    }
}
