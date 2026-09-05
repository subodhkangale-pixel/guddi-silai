import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

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
import { addCartItem, clearCart, getCart, updateCartItem, updateMeasurements, AddCartItemInput, MeasurementValue } from './cartApi';
import { createOrder, CreateOrderInput, getOrders } from './orderApi';

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

export function useCart() {
  return useQuery({ queryKey: ['cart'], queryFn: getCart });
}

export function useAddCartItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AddCartItemInput) => addCartItem(input),
    onSuccess: (result) => {
      queryClient.setQueryData(['cart'], result);
    },
  });
}

export function useUpdateCartItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ index, quantity }: { index: number; quantity: number }) =>
      updateCartItem(index, quantity),
    onSuccess: (result) => {
      queryClient.setQueryData(['cart'], result);
    },
  });
}

export function useUpdateMeasurements() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ index, values }: { index: number; values: MeasurementValue[] }) => updateMeasurements(index, values),
    onSuccess: (result) => {
      queryClient.setQueryData(['cart'], result);
    },
  });
}

export function useClearCart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: clearCart,
    onSuccess: (result) => {
      queryClient.setQueryData(['cart'], result);
    },
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateOrderInput) => createOrder(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
}

export function useOrders() {
  return useQuery({ queryKey: ['orders'], queryFn: getOrders });
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