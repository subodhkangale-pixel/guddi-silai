import { apiRequest } from './client';
import { resolveIdentityToken } from './authApi';

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
  addonIds?: string[];
}

export interface StyleOptions {
  neckline?: string;
  sleeveStyle?: string;
  backDesign?: string;
  embroideryPlacement?: string;
  fitting?: string;
}

export interface MeasurementSnapshotValue {
  fieldId: string;
  fieldKey: string;
  label: string;
  value: number;
  unit: string;
}

export interface MeasurementSnapshot {
  values: MeasurementSnapshotValue[];
  measurementInstructionVersion: number;
  sourceProfileId: string | null;
}

export interface OrderItem {
  productName: string;
  productDesignId?: string | null;
  variantId?: string | null;
  sku?: string | null;
  productType: 'READY_MADE' | 'CUSTOMIZE';
  color?: string | null;
  size?: string | null;
  fiber?: string | null;
  embroidery?: string | null;
  quantity: number;
  unitPrice: number;
  discount?: number | null;
  measurementSnapshot?: MeasurementSnapshot | null;
  customizationNotes?: string | null;
  styleOptions?: StyleOptions | null;
  total: number;
}

export interface OrderCustomer {
  name: string;
  mobile: string;
  email?: string | null;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

export interface OrderPayment {
  method: string;
  status: string;
  transactionId?: string | null;
  amount: number;
  paidAt?: string | null;
}

export interface OrderAddon {
  name: string;
  description?: string | null;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId?: string | null;
  status: string;
  customer: OrderCustomer;
  items: OrderItem[];
  addons?: OrderAddon[] | null;
  payment?: OrderPayment | null;
  coupon?: { code: string; type: string; discount: number } | null;
  offer?: { name: string; type: string; discount: number } | null;
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function createOrder(input: CreateOrderInput) {
  const token = await resolveIdentityToken();
  return apiRequest<{ data: Order }>('/orders', { method: 'POST', token, body: input });
}

export async function getOrders() {
  const token = await resolveIdentityToken();
  return apiRequest<{ data: Order[] }>('/orders', { token });
}

export async function getOrderByNumber(orderNumber: string) {
  const token = await resolveIdentityToken();
  return apiRequest<{ data: Order }>(`/orders/${orderNumber}`, { token });
}
