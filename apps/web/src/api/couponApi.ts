import { apiRequestAuth } from './admin';

export interface Coupon {
  id: string;
  code: string;
  type: 'PERCENT' | 'FIXED';
  value: number;
  minOrderAmount?: number | null;
  maxDiscount?: number | null;
  usageLimit?: number | null;
  usedCount: number;
  applicableCategoryIds: string[];
  applicableProductIds: string[];
  expiresAt?: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface CouponInput {
  code: string;
  type: 'PERCENT' | 'FIXED';
  value: number;
  minOrderAmount?: number;
  maxDiscount?: number;
  usageLimit?: number;
  expiresAt?: string;
}

export async function adminListCoupons() {
  return apiRequestAuth<{ data: Coupon[] }>('/admin/coupons');
}

export async function adminCreateCoupon(input: CouponInput) {
  return apiRequestAuth<{ data: Coupon }>('/admin/coupons', {
    method: 'POST',
    body: input,
  });
}

export async function adminUpdateCoupon(id: string, input: Partial<CouponInput>) {
  return apiRequestAuth<{ data: Coupon }>(`/admin/coupons/${id}`, {
    method: 'PATCH',
    body: input,
  });
}

export async function adminDeleteCoupon(id: string) {
  return apiRequestAuth<{ data: Coupon }>(`/admin/coupons/${id}`, {
    method: 'DELETE',
  });
}