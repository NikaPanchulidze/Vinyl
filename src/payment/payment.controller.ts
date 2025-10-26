import { Controller, Post, Req, Headers, RawBodyRequest } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { ApiOperation } from '@nestjs/swagger';

@Controller('payment')
export class PaymentController {
    constructor(private readonly paymentService: PaymentService) {}

    @Post('webhook')
    @ApiOperation({ summary: 'Handle Stripe webhook events' })
    public handleWebhook(
        @Headers('stripe-signature') signature: string,
        @Req() req: Request & { rawBody: Buffer }
    ): Promise<{ received: boolean }> {
        return this.paymentService.handleWebhook(signature, req);
    }
}
