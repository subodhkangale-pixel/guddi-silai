import { apiRequest } from './client';
import { ensureGuestToken } from './cartApi';

export interface CreateOrderInput {
  name: string;
  mobile: string;
  email?: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  notes?: string;
  shipping?: number;
  paymentMethod: 'COD' | 'UPI' | 'NET_BANKING' | 'RAZORPAY';
}

export interface OrderResult {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  createdAt?: string;
  payment?: { status: string; method: string } | null;
}

export async function createOrder(input: CreateOrderInput) {
  const token = await ensureGuestToken();
  return apiRequest<{ data: OrderResult }>('/orders', { method: 'POST', token, body: input });
}

export async function getOrders() {
  const token = await ensureGuestToken();
  return apiRequest<{ data: OrderResult[] }>('/orders', { token });
}
