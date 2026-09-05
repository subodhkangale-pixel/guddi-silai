import { apiRequest } from './client';
import { apiRequestAuth } from './admin';
import {
  AdminProduct,
  ApiListResponse,
  Category,
  Color,
  CursorResponse,
  Embroidery,
  Fiber,
  PaginatedResponse,
  ProductCard,
  ProductDetail,
  ProductQuery,
  ProductVariant,
  Size,
  SubCategory,
} from './types';

// ──────────────────────────────────────────────
// Public catalogue references
// ──────────────────────────────────────────────

export async function getCategories() {
  return apiRequest<ApiListResponse<Category>>('/categories');
}

export async function getSubCategories(params?: { categoryId?: string }) {
  return apiRequest<ApiListResponse<SubCategory>>('/subcategories', {
    query: params,
  });
}

export async function getColors() {
  return apiRequest<ApiListResponse<Color>>('/colors');
}

export async function getSizes() {
  return apiRequest<ApiListResponse<Size>>('/sizes');
}

export async function getFibers() {
  return apiRequest<ApiListResponse<Fiber>>('/fibers');
}

export async function getEmbroideries() {
  return apiRequest<ApiListResponse<Embroidery>>('/embroidery');
}

// ──────────────────────────────────────────────
// Products (public)
// ──────────────────────────────────────────────

export async function getProducts(params: ProductQuery = {}, cursor?: string) {
  return apiRequest<CursorResponse<ProductCard>>('/products', {
    query: { ...params, cursor, limit: 20 },
  });
}

export async function getProductBySlug(slug: string) {
  return apiRequest<{ data: ProductDetail }>(`/products/${slug}`);
}

export interface FiberAvailability {
  fiberId: string;
  fiberName: string;
  fiberPrice: number;
  colors: { colorId: string; colorName: string; stock: number }[];
}

export async function getFiberAvailability(productId: string) {
  return apiRequest<{ data: FiberAvailability[] }>(`/products/fiber/${productId}/availability`);
}

// ──────────────────────────────────────────────
// Admin catalogue + products
// ──────────────────────────────────────────────

export interface CatalogueEntity {
  id: string;
  name: string;
  isActive: boolean;
  [key: string]: unknown;
}

export async function adminList(path: string, params?: Record<string, string>) {
  return apiRequestAuth<ApiListResponse<CatalogueEntity>>(path, { query: params });
}

export async function adminCreate(path: string, body: unknown) {
  return apiRequestAuth<{ data: CatalogueEntity }>(path, { method: 'POST', body });
}

export async function adminUpdate(path: string, body: unknown) {
  return apiRequestAuth<{ data: CatalogueEntity }>(path, { method: 'PATCH', body });
}

export async function adminDelete(path: string) {
  return apiRequestAuth<{ data: { id: string } }>(path, { method: 'DELETE' });
}

export async function adminListProducts(
  params: Record<string, string | number | undefined>
) {
  return apiRequestAuth<{ data: PaginatedResponse<AdminProduct> }>(
    '/admin/products',
    { query: params }
  );
}

export async function adminCreateProduct(body: unknown) {
  return apiRequestAuth<{ data: AdminProduct }>('/admin/products', {
    method: 'POST',
    body,
  });
}

export async function adminUpdateProduct(id: string, body: unknown) {
  return apiRequestAuth<{ data: AdminProduct }>(`/admin/products/${id}`, {
    method: 'PATCH',
    body,
  });
}

export async function adminDeleteProduct(id: string) {
  return apiRequestAuth<{ data: { id: string } }>(`/admin/products/${id}`, {
    method: 'DELETE',
  });
}

export async function adminAddVariant(productId: string, body: unknown) {
  return apiRequestAuth<{ data: ProductVariant }>(
    `/admin/products/${productId}/variants`,
    { method: 'POST', body }
  );
}

export async function adminUpdateVariant(variantId: string, body: unknown) {
  return apiRequestAuth<{ data: ProductVariant }>(
    `/admin/products/variants/${variantId}`,
    { method: 'PATCH', body }
  );
}

export async function adminDeleteVariant(variantId: string) {
  return apiRequestAuth<{ data: { id: string } }>(
    `/admin/products/variants/${variantId}`,
    { method: 'DELETE' }
  );
}

export const CATALOGUE_PATHS = {
  categories: '/admin/categories',
  subcategories: '/admin/subcategories',
  colors: '/admin/colors',
  sizes: '/admin/sizes',
  fibers: '/admin/fibers',
  embroidery: '/admin/embroidery',
} as const;