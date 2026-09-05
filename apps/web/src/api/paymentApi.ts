import { apiRequest } from './client';
import { resolveIdentityToken } from './authApi';

export interface RazorpayOrder {
  keyId: string;
  orderId: string;
  amount: number;
  currency: string;
}

export async function createPayment(orderNumber: string) {
  const token = await resolveIdentityToken();
  return apiRequest<{ data: RazorpayOrder }>('/payments/create', {
    method: 'POST', token, body: { orderNumber },
  });
}

export async function verifyPayment(input: {
  orderNumber: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}) {
  const token = await resolveIdentityToken();
  return apiRequest<{ data: unknown }>('/payments/verify', {
    method: 'POST', token, body: input,
  });
}
