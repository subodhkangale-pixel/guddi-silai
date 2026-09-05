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
import { addCartItem, applyCoupon, clearCart, getCart, removeCoupon, updateCartItem, updateMeasurements, updateStyleOptions, AddCartItemInput, MeasurementValue, UpdateStyleOptionsInput } from './cartApi';
import { getMeasurementFields } from './measurementApi';
import { getFiberAvailability } from './catalogApi';
import { createOrder, CreateOrderInput, getOrders, getOrderByNumber } from './orderApi';
import { getAddons, adminListAddons, adminCreateAddon, adminUpdateAddon, adminRemoveAddon, AdminAddonInput } from './addonApi';
import { getNotifications, markNotificationRead } from './notificationApi';
import {
  adminListReviews,
  adminModerateReview,
  createReview,
  CreateReviewInput,
  getProductReviews,
} from './reviewApi';
import {
  adminCreateCoupon,
  adminDeleteCoupon,
  adminListCoupons,
  adminUpdateCoupon,
  Coupon,
  CouponInput,
} from './couponApi';
import {
  adminCreateOffer,
  adminDeactivateOffer,
  adminListOffers,
  Offer,
  OfferInput,
} from './offerApi';
import {
  adminCreateUser,
  adminDeleteUser,
  adminListUsers,
  adminUpdateUser,
  adminListRoles,
  adminCreateRole,
  adminUpdateRole,
  adminDeleteRole,
  adminListPermissions,
  adminListActivity,
  AdminUserInput,
  AdminRoleInput,
  ActivityQuery,
} from './adminManagementApi';

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

export function useUpdateStyleOptions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ index, styleOptions }: { index: number; styleOptions: UpdateStyleOptionsInput['styleOptions'] }) => updateStyleOptions(index, styleOptions),
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

export function useAddons() {
  return useQuery({ queryKey: ['addons'], queryFn: getAddons });
}

export function useOrders() {
  return useQuery({ queryKey: ['orders'], queryFn: getOrders });
}

export function useOrder(orderNumber: string | undefined) {
  return useQuery({
    queryKey: ['order', orderNumber],
    queryFn: () => getOrderByNumber(orderNumber!),
    enabled: Boolean(orderNumber),
    retry: false,
  });
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

// ──────────────────────────────────────────────
// Reviews
// ──────────────────────────────────────────────

export function useProductReviews(productId: string | undefined) {
  return useQuery({
    queryKey: ['reviews', productId],
    queryFn: () => getProductReviews(productId!),
    enabled: Boolean(productId),
  });
}

export function useCreateReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateReviewInput) => createReview(input),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['reviews', variables.productId] });
    },
  });
}

export function useAdminReviews(status?: string) {
  return useQuery({
    queryKey: ['admin-reviews', status],
    queryFn: () => adminListReviews(status),
  });
}

export function useAdminModerateReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'approved' | 'rejected' }) =>
      adminModerateReview(id, status),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
    },
  });
}

// ──────────────────────────────────────────────
// Admin coupons
// ──────────────────────────────────────────────

export function useAdminCoupons() {
  return useQuery({ queryKey: ['admin-coupons'], queryFn: adminListCoupons });
}

export function useAdminCouponMutations() {
  const queryClient = useQueryClient();
  const refresh = () => void queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
  const create = useMutation({
    mutationFn: (input: CouponInput) => adminCreateCoupon(input),
    onSuccess: refresh,
  });
  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<CouponInput> }) =>
      adminUpdateCoupon(id, input),
    onSuccess: refresh,
  });
  const remove = useMutation({
    mutationFn: (id: string) => adminDeleteCoupon(id),
    onSuccess: refresh,
  });
  return { create, update, remove };
}

// ──────────────────────────────────────────────
// Admin offers
// ──────────────────────────────────────────────

export function useAdminOffers() {
  return useQuery({ queryKey: ['admin-offers'], queryFn: adminListOffers });
}

export function useAdminOfferMutations() {
  const queryClient = useQueryClient();
  const refresh = () => void queryClient.invalidateQueries({ queryKey: ['admin-offers'] });
  const create = useMutation({
    mutationFn: (input: OfferInput) => adminCreateOffer(input),
    onSuccess: refresh,
  });
  const deactivate = useMutation({
    mutationFn: (id: string) => adminDeactivateOffer(id),
    onSuccess: refresh,
  });
  return { create, deactivate };
}

// ──────────────────────────────────────────────
// Admin users / roles / permissions / activity
// ──────────────────────────────────────────────

export function useAdminUsers() {
  return useQuery({ queryKey: ['admin-users'], queryFn: adminListUsers });
}

export function useAdminUserMutations() {
  const queryClient = useQueryClient();
  const refreshAdminUsers = () => void queryClient.invalidateQueries({ queryKey: ['admin-users'] });
  const create = useMutation({
    mutationFn: (input: AdminUserInput) => adminCreateUser(input),
    onSuccess: refreshAdminUsers,
  });
  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<AdminUserInput> & { isActive?: boolean } }) =>
      adminUpdateUser(id, input),
    onSuccess: refreshAdminUsers,
  });
  const remove = useMutation({
    mutationFn: (id: string) => adminDeleteUser(id),
    onSuccess: refreshAdminUsers,
  });
  return { create, update, remove };
}

export function useAdminRoles() {
  return useQuery({ queryKey: ['admin-roles'], queryFn: adminListRoles });
}

export function useAdminRoleMutations() {
  const queryClient = useQueryClient();
  const refreshRoles = () => {
    void queryClient.invalidateQueries({ queryKey: ['admin-roles'] });
    void queryClient.invalidateQueries({ queryKey: ['admin-users'] });
  };
  const create = useMutation({
    mutationFn: (input: AdminRoleInput) => adminCreateRole(input),
    onSuccess: refreshRoles,
  });
  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<AdminRoleInput> }) =>
      adminUpdateRole(id, input),
    onSuccess: refreshRoles,
  });
  const remove = useMutation({
    mutationFn: (id: string) => adminDeleteRole(id),
    onSuccess: refreshRoles,
  });
  return { create, update, remove };
}

export function useAdminPermissions() {
  return useQuery({ queryKey: ['admin-permissions'], queryFn: adminListPermissions });
}

export function useAdminActivity(query: ActivityQuery = {}) {
  return useQuery({ queryKey: ['admin-activity', query], queryFn: () => adminListActivity(query), placeholderData: (previous) => previous });
}

// ──────────────────────────────────────────────
// Admin add-ons
// ──────────────────────────────────────────────

export function useAdminAddons() {
  return useQuery({ queryKey: ['admin-addons'], queryFn: adminListAddons });
}

export function useAdminAddonMutations() {
  const queryClient = useQueryClient();
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ['admin-addons'] });
    void queryClient.invalidateQueries({ queryKey: ['addons'] });
  };
  const create = useMutation({
    mutationFn: (input: AdminAddonInput) => adminCreateAddon(input),
    onSuccess: refresh,
  });
  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<AdminAddonInput> }) =>
      adminUpdateAddon(id, input),
    onSuccess: refresh,
  });
  const remove = useMutation({
    mutationFn: (id: string) => adminRemoveAddon(id),
    onSuccess: refresh,
  });
  return { create, update, remove };
}