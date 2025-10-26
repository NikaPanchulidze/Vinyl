/* eslint-disable @typescript-eslint/no-floating-promises */
import * as assert from 'node:assert';
import { beforeEach, describe, it } from 'node:test';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';

class FakePaymentService {
    public lastSignature: string | null = null;
    public lastRawBody: Buffer | null = null;

    handleWebhook(signature: string, req: { rawBody: Buffer }) {
        this.lastSignature = signature;
        this.lastRawBody = req.rawBody;
        return Promise.resolve({ received: true });
    }
}

describe('PaymentController (unit)', () => {
    let controller: PaymentController;
    let fakeService: FakePaymentService;

    beforeEach(() => {
        fakeService = new FakePaymentService();
        controller = new PaymentController(
            fakeService as unknown as PaymentService
        );
    });

    it('should call handleWebhook and return received=true', async () => {
        const payload = Buffer.from(
            JSON.stringify({ event: 'payment_intent.succeeded' })
        );
        const signature = 'test-signature';

        const result = await controller.handleWebhook(signature, {
            rawBody: payload,
        } as Request & { rawBody: Buffer<ArrayBufferLike> });

        assert.deepStrictEqual(result, { received: true });

        // Check that service received correct parameters
        assert.strictEqual(fakeService.lastSignature, signature);
        assert.strictEqual(
            fakeService.lastRawBody?.toString(),
            payload.toString()
        );
    });
});
