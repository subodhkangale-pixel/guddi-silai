import crypto from 'node:crypto';

import { PaymentMethod, PaymentStatus } from '@prisma/client';

import { env } from '../config/env.js';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { CreatePaymentInput, VerifyPaymentInput } from './payments.schemas.js';

function requireRazorpayConfig() {
  if (!env.razorpay.keyId || !env.razorpay.keySecret) {
    throw new AppError(503, 'Online payments are not configured yet');
  }
}

async function findOwnedOrder(userId: string, orderNumber: string) {
  const order = await prisma.order.findFirst({ where: { userId, orderNumber } });
  if (!order) throw new AppError(404, 'Order not found');
  return order;
}

export async function createPayment(userId: string, input: CreatePaymentInput) {
  requireRazorpayConfig();
  const order = await findOwnedOrder(userId, input.orderNumber);
  const onlineMethods: PaymentMethod[] = [PaymentMethod.RAZORPAY, PaymentMethod.UPI, PaymentMethod.NET_BANKING];
  if (!order.payment || !onlineMethods.includes(order.payment.method)) {
    throw new AppError(400, 'This order does not use online payment');
  }
  if (order.payment.status === PaymentStatus.SUCCESS) throw new AppError(409, 'Order is already paid');

  const response = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${env.razorpay.keyId}:${env.razorpay.keySecret}`).toString('base64')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ amount: Math.round(order.total * 100), currency: 'INR', receipt: order.orderNumber, payment_capture: 1 }),
  });
  if (!response.ok) throw new AppError(502, 'Payment provider could not create an order');
  const razorpayOrder = (await response.json()) as { id: string; amount: number; currency: string };

  await prisma.order.update({
    where: { id: order.id },
    data: { payment: { ...order.payment, transactionId: razorpayOrder.id } },
  });
  return { keyId: env.razorpay.keyId, orderId: razorpayOrder.id, amount: razorpayOrder.amount, currency: razorpayOrder.currency };
}

export async function verifyPayment(userId: string, input: VerifyPaymentInput) {
  requireRazorpayConfig();
  const order = await findOwnedOrder(userId, input.orderNumber);
  if (order.payment?.transactionId !== input.razorpayOrderId) throw new AppError(400, 'Payment order mismatch');
  if (!order.payment) throw new AppError(400, 'Payment details are missing');
  const expected = crypto.createHmac('sha256', env.razorpay.keySecret).update(`${input.razorpayOrderId}|${input.razorpayPaymentId}`).digest('hex');
  const provided = Buffer.from(input.razorpaySignature);
  const expectedBuffer = Buffer.from(expected);
  if (provided.length !== expectedBuffer.length || !crypto.timingSafeEqual(expectedBuffer, provided)) throw new AppError(400, 'Invalid payment signature');
  if (order.payment.status === PaymentStatus.SUCCESS) return order;
  return prisma.order.update({
    where: { id: order.id },
    data: { payment: { method: order.payment.method, status: PaymentStatus.SUCCESS, transactionId: input.razorpayPaymentId, amount: order.payment.amount, paidAt: new Date() } },
  });
}

export async function handleWebhook(signature: string | undefined, rawBody: Buffer | undefined, payload: unknown) {
  if (!env.razorpay.webhookSecret) throw new AppError(503, 'Payment webhook is not configured');
  if (!signature || !rawBody) throw new AppError(400, 'Missing payment webhook signature');
  const expected = crypto.createHmac('sha256', env.razorpay.webhookSecret).update(rawBody).digest('hex');
  const provided = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (provided.length !== expectedBuffer.length || !crypto.timingSafeEqual(expectedBuffer, provided)) throw new AppError(400, 'Invalid webhook signature');

  const event = payload as { event?: string; payload?: { payment?: { entity?: { order_id?: string; id?: string; status?: string } } } };
  const entity = event.payload?.payment?.entity;
  if (!entity?.order_id) return { received: true };
  const orders = await prisma.order.findMany();
  const order = orders.find((candidate) => candidate.payment?.transactionId === entity.order_id);
  if (!order || order.payment?.status === PaymentStatus.SUCCESS) return { received: true };
  if (!order.payment) return { received: true };
  if (event.event === 'payment.captured' || event.event === 'order.paid') {
    await prisma.order.update({ where: { id: order.id }, data: { payment: { method: order.payment.method, status: PaymentStatus.SUCCESS, transactionId: entity.id ?? entity.order_id, amount: order.payment.amount, paidAt: new Date() } } });
  } else if (event.event === 'payment.failed') {
    await prisma.order.update({ where: { id: order.id }, data: { payment: { method: order.payment.method, status: PaymentStatus.FAILED, transactionId: entity.id ?? entity.order_id, amount: order.payment.amount, paidAt: order.payment.paidAt } } });
  }
  return { received: true };
}
