import { apiRequest } from './client';
import { getAuthToken } from './authApi';
import { apiRequestAuth } from './admin';

export interface Review {
  id: string;
  productId: string;
  userId: string;
  rating: number;
  title?: string | null;
  text?: string | null;
  images: string[];
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface CreateReviewInput {
  productId: string;
  rating: number;
  title?: string;
  text?: string;
  images?: string[];
}

export async function getProductReviews(productId: string) {
  return apiRequest<{ data: Review[] }>(`/reviews/products/${productId}/reviews`);
}

export async function createReview(input: CreateReviewInput) {
  const token = getAuthToken();
  if (!token) throw new Error('You must be signed in to review a product');
  return apiRequest<{ data: Review }>('/reviews/reviews', {
    method: 'POST',
    body: input,
    token,
  });
}

export async function adminListReviews(status?: string) {
  return apiRequestAuth<{ data: Review[] }>('/admin/reviews', {
    query: { status },
  });
}

export async function adminModerateReview(id: string, status: 'approved' | 'rejected') {
  return apiRequestAuth<{ data: Review }>(`/admin/reviews/${id}`, {
    method: 'PATCH',
    body: { status },
  });
}