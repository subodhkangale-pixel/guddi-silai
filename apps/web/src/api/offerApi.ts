import { apiRequestAuth } from './admin';

export interface Offer {
  id: string;
  name: string;
  description?: string | null;
  type: 'PERCENT' | 'FIXED' | 'FESTIVAL';
  value: number;
  applicableCategoryIds: string[];
  applicableProductIds: string[];
  startDate?: string | null;
  endDate?: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface OfferInput {
  name: string;
  description?: string;
  type: 'PERCENT' | 'FIXED' | 'FESTIVAL';
  value: number;
  applicableCategoryIds?: string[];
  applicableProductIds?: string[];
  startDate?: string;
  endDate?: string;
}

export async function adminListOffers() {
  return apiRequestAuth<{ data: Offer[] }>('/offers/admin');
}

export async function adminCreateOffer(input: OfferInput) {
  return apiRequestAuth<{ data: Offer }>('/offers/admin', {
    method: 'POST',
    body: input,
  });
}

export async function adminDeactivateOffer(id: string) {
  return apiRequestAuth<{ data: Offer }>(`/offers/admin/${id}`, {
    method: 'DELETE',
  });
}