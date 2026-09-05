import crypto from 'node:crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/config/env.js', () => ({
  env: {
    razorpay: { keyId: 'rzp_test_key', keySecret: 'test-secret', webhookSecret: 'webhook-secret' },
  },
}));
vi.mock('../src/lib/prisma.js', () => ({
  prisma: {
    order: { findFirst: vi.fn(), update: vi.fn(), findMany: vi.fn() },
  },
}));

import { prisma } from '../src/lib/prisma.js';
import * as paymentService from '../src/payments/payments.service.js';

const payment = { method: 'RAZORPAY' as const, status: 'PENDING' as const, transactionId: null, amount: 999, paidAt: null };
const order = { id: 'o1', orderNumber: 'GS-1', total: 999, payment };

beforeEach(() => {
  vi.clearAllMocks();
  prisma.order.findFirst.mockResolvedValue(order);
  prisma.order.update.mockResolvedValue({ ...order, payment: { ...payment, transactionId: 'pay-order-1' } });
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ id: 'pay-order-1', amount: 99900, currency: 'INR' }) }));
});

describe('payment service', () => {
  it('creates a Razorpay order from the server-side total', async () => {
    const result = await paymentService.createPayment('user-1', { orderNumber: 'GS-1' });
    expect(result).toMatchObject({ orderId: 'pay-order-1', amount: 99900, currency: 'INR' });
    expect(fetch).toHaveBeenCalledWith('https://api.razorpay.com/v1/orders', expect.objectContaining({ body: expect.stringContaining('99900') }));
  });

  it('rejects an invalid payment signature', async () => {
    prisma.order.findFirst.mockResolvedValue({ ...order, payment: { ...payment, transactionId: 'pay-order-1' } });
    await expect(paymentService.verifyPayment('user-1', {
      orderNumber: 'GS-1', razorpayOrderId: 'pay-order-1', razorpayPaymentId: 'pay-1', razorpaySignature: 'bad',
    })).rejects.toMatchObject({ statusCode: 400 });
  });

  it('accepts a valid payment signature and marks the order paid', async () => {
    prisma.order.findFirst.mockResolvedValue({ ...order, payment: { ...payment, transactionId: 'pay-order-1' } });
    const signature = crypto.createHmac('sha256', 'test-secret').update('pay-order-1|pay-1').digest('hex');
    await paymentService.verifyPayment('user-1', {
      orderNumber: 'GS-1', razorpayOrderId: 'pay-order-1', razorpayPaymentId: 'pay-1', razorpaySignature: signature,
    });
    expect(prisma.order.update).toHaveBeenCalledWith(expect.objectContaining({ data: { payment: expect.objectContaining({ status: 'SUCCESS', transactionId: 'pay-1' }) } }));
  });
});
