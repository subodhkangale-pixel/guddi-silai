import { apiRequest } from './client';
import { getAuthToken } from './authApi';

export interface WishlistItem {
  productId: string;
  productName: string;
  productDesignId: string | null;
  productImage: string | null;
  productType: 'READY_MADE' | 'CUSTOMIZE';
  slug?: string | null;
  basePrice: number;
  isActive: boolean;
}

export interface Wishlist {
  id: string;
  userId: string;
  items: WishlistItem[];
}

export async function getWishlist() {
  const token = getAuthToken();
  if (!token) return null;
  return apiRequest<{ data: Wishlist }>('/wishlist', { token });
}

export async function addWishlistItem(productId: string) {
  const token = getAuthToken();
  if (!token) return null;
  return apiRequest<{ data: Wishlist }>('/wishlist', {
    method: 'POST',
    token,
    body: { productId },
  });
}

export async function removeWishlistItem(productId: string) {
  const token = getAuthToken();
  if (!token) return null;
  return apiRequest<{ data: Wishlist }>(`/wishlist/${productId}`, {
    method: 'DELETE',
    token,
  });
}