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
import { addCartItem, applyCoupon, clearCart, getCart, removeCoupon, updateCartItem, updateMeasurements, AddCartItemInput, MeasurementValue } from './cartApi';
import { getMeasurementFields } from './measurementApi';
import { getFiberAvailability } from './catalogApi';
import { createOrder, CreateOrderInput, getOrders } from './orderApi';
import { getNotifications, markNotificationRead } from './notificationApi';

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

export function useFiberAvailability(productId: string | undefined) {
  return useQuery({
    queryKey: ['fiber-availability', productId],
    queryFn: () => getFiberAvailability(productId!),
    enabled: Boolean(productId),
  });
}

export function useCart() {
  return useQuery({ queryKey: ['cart'], queryFn: getCart });
}

export function useMeasurementFields() {
  return useQuery({ queryKey: ['measurement-fields'], queryFn: getMeasurementFields, staleTime: 60 * 60 * 1000 });
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

export function useApplyCoupon() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: applyCoupon, onSuccess: (result) => queryClient.setQueryData(['cart'], { data: result.data.cart }) });
}

export function useRemoveCoupon() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: removeCoupon, onSuccess: (result) => queryClient.setQueryData(['cart'], result) });
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

export function useNotifications() {
  return useQuery({ queryKey: ['notifications'], queryFn: getNotifications });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
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