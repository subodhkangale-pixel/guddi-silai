import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

import { getAdminMe } from './admin';
import {
  getCategories,
  getColors,
  getEmbroideries,
  getFibers,
  getProductBySlug,
  getProducts,
  getSizes,
  getSubCategories,
} from './catalogApi';
import { Category, CursorResponse, ProductCard, ProductDetail, ProductQuery } from './types';

// ──────────────────────────────────────────────
// Catalogue reference hooks
// ──────────────────────────────────────────────

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => (await getCategories()).data as Category[],
  });
}

export function useSubCategories(categoryId?: string) {
  return useQuery({
    queryKey: ['subcategories', categoryId],
    queryFn: async () => (await getSubCategories({ categoryId })).data,
    enabled: Boolean(categoryId),
  });
}

export function useColors() {
  return useQuery({ queryKey: ['colors'], queryFn: () => getColors() });
}

export function useSizes() {
  return useQuery({ queryKey: ['sizes'], queryFn: () => getSizes() });
}

export function useFibers() {
  return useQuery({ queryKey: ['fibers'], queryFn: () => getFibers() });
}

export function useEmbroideries() {
  return useQuery({ queryKey: ['embroidery'], queryFn: () => getEmbroideries() });
}

// ──────────────────────────────────────────────
// Product hooks
// ──────────────────────────────────────────────

export function useProducts(params: ProductQuery = {}) {
  return useInfiniteQuery<CursorResponse<ProductCard>>({
    queryKey: ['products', params],
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) => getProducts(params, pageParam as string | undefined),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}

export function useProduct(slug: string | undefined) {
  return useQuery<{ data: ProductDetail }>({
    queryKey: ['product', slug],
    queryFn: () => getProductBySlug(slug!),
    enabled: Boolean(slug),
    retry: false,
  });
}

// ──────────────────────────────────────────────
// Admin session hook
// ──────────────────────────────────────────────

export function useAdminMe(token: string | null) {
  return useQuery({
    queryKey: ['admin-me', token],
    queryFn: () => getAdminMe(token!),
    enabled: Boolean(token),
    retry: false,
  });
}