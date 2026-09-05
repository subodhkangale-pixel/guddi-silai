import { apiRequest } from './client';

const GUEST_TOKEN_KEY = 'guddi-silai-guest-token';

export interface CartItem {
  productType: 'READY_MADE' | 'CUSTOMIZE';
  productId: string;
  productName: string;
  productDesignId: string | null;
  productImage: string | null;
  variantId: string | null;
  color: string | null;
  colorId: string | null;
  size: string | null;
  sizeId: string | null;
  fiberId: string | null;
  fiberName: string | null;
  fiberPrice: number | null;
  embroideryId: string | null;
  embroideryName: string | null;
  embroiderySurcharge: number | null;
  unitPrice: number;
  discount: number | null;
  quantity: number;
  measurementStatus: string | null;
  measurementValues: unknown;
}

export interface Cart {
  id: string;
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  couponCode?: string | null;
  discount?: number;
}

export interface AddCartItemInput {
  productId: string;
  productType: 'READY_MADE' | 'CUSTOMIZE';
  variantId?: string;
  colorId?: string;
  fiberId?: string;
  quantity?: number;
}

export interface MeasurementValue {
  fieldKey: string;
  label: string;
  value: number;
  unit: 'INCHES' | 'CM';
}

export async function ensureGuestToken(): Promise<string> {
  const saved = window.localStorage.getItem(GUEST_TOKEN_KEY);
  if (saved) return saved;
  const result = await apiRequest<{ data: { token: string } }>('/auth/guest', {
    method: 'POST',
  });
  window.localStorage.setItem(GUEST_TOKEN_KEY, result.data.token);
  return result.data.token;
}

export async function getCart() {
  const token = await ensureGuestToken();
  return apiRequest<{ data: Cart }>('/cart', { token });
}

export async function addCartItem(input: AddCartItemInput) {
  const token = await ensureGuestToken();
  return apiRequest<{ data: Cart }>('/cart/items', {
    method: 'POST',
    token,
    body: input,
  });
}

export async function updateCartItem(index: number, quantity: number) {
  const token = await ensureGuestToken();
  return apiRequest<{ data: Cart }>(`/cart/items/${index}`, {
    method: 'PATCH',
    token,
    body: { quantity },
  });
}

export async function updateMeasurements(index: number, values: MeasurementValue[]) {
  const token = await ensureGuestToken();
  return apiRequest<{ data: Cart }>(`/cart/items/${index}/measurements`, {
    method: 'POST',
    token,
    body: { values },
  });
}

export async function clearCart() {
  const token = await ensureGuestToken();
  return apiRequest<{ data: Cart }>('/cart', { method: 'DELETE', token });
}

export async function applyCoupon(code: string) {
  const token = await ensureGuestToken();
  return apiRequest<{ data: { cart: Cart; discount: number } }>('/coupons/apply', { method: 'POST', token, body: { code } });
}

export async function removeCoupon() {
  const token = await ensureGuestToken();
  return apiRequest<{ data: Cart }>('/coupons', { method: 'DELETE', token });
}
