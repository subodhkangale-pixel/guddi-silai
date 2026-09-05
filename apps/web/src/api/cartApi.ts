import { apiRequest } from './client';
import { resolveIdentityToken } from './authApi';

export { ensureGuestToken } from './authApi';

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
  styleOptions?: { neckline?: string; sleeveStyle?: string; backDesign?: string; embroideryPlacement?: string; fitting?: string } | null;
}

export interface CartSections {
  readyMade: { count: number; quantity: number; subtotal: number };
  customize: { count: number; quantity: number; subtotal: number };
  measurementPending: boolean;
}

export interface Cart {
  id: string;
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  couponCode?: string | null;
  discount?: number;
  offerDiscount?: number;
  sections?: CartSections;
}

export interface AddCartItemInput {
  productId: string;
  productType: 'READY_MADE' | 'CUSTOMIZE';
  variantId?: string;
  colorId?: string;
  fiberId?: string;
  embroideryId?: string;
  quantity?: number;
  styleOptions?: { neckline?: string; sleeveStyle?: string; backDesign?: string; embroideryPlacement?: string; fitting?: string };
}

export interface UpdateStyleOptionsInput {
  styleOptions: { neckline?: string; sleeveStyle?: string; backDesign?: string; embroideryPlacement?: string; fitting?: string };
}

export interface MeasurementValue {
  fieldId?: string;
  fieldKey: string;
  label: string;
  value: number;
  unit: 'INCHES' | 'CM';
}

export async function getCart() {
  const token = await resolveIdentityToken();
  return apiRequest<{ data: Cart }>('/cart', { token });
}

export async function addCartItem(input: AddCartItemInput) {
  const token = await resolveIdentityToken();
  return apiRequest<{ data: Cart }>('/cart/items', {
    method: 'POST',
    token,
    body: input,
  });
}

export async function updateCartItem(index: number, quantity: number) {
  const token = await resolveIdentityToken();
  return apiRequest<{ data: Cart }>(`/cart/items/${index}`, {
    method: 'PATCH',
    token,
    body: { quantity },
  });
}

export async function updateStyleOptions(index: number, styleOptions: UpdateStyleOptionsInput['styleOptions']) {
  const token = await resolveIdentityToken();
  return apiRequest<{ data: Cart }>(`/cart/items/${index}/style-options`, {
    method: 'PATCH',
    token,
    body: { styleOptions },
  });
}

export async function updateMeasurements(index: number, values: MeasurementValue[]) {
  const token = await resolveIdentityToken();
  return apiRequest<{ data: Cart }>(`/cart/items/${index}/measurements`, {
    method: 'POST',
    token,
    body: { values },
  });
}

export async function clearCart() {
  const token = await resolveIdentityToken();
  return apiRequest<{ data: Cart }>('/cart', { method: 'DELETE', token });
}

export async function applyCoupon(code: string) {
  const token = await resolveIdentityToken();
  return apiRequest<{ data: { cart: Cart; discount: number } }>('/coupons/apply', { method: 'POST', token, body: { code } });
}

export async function removeCoupon() {
  const token = await resolveIdentityToken();
  return apiRequest<{ data: Cart }>('/coupons', { method: 'DELETE', token });
}
