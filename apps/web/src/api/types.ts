import { SortOption, AvailabilityFilter } from '@guddi-silai/shared';

export interface ApiListResponse<T> {
  data: T[];
}

export interface CursorResponse<T> {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  isActive: boolean;
}

export interface SubCategory {
  id: string;
  name: string;
  slug: string;
  categoryId: string;
  isActive: boolean;
}

export interface Color {
  id: string;
  name: string;
  hex: string | null;
  isActive: boolean;
}

export interface Size {
  id: string;
  name: string;
  code: string | null;
  isActive: boolean;
}

export interface Fiber {
  id: string;
  name: string;
  price: number;
  isActive: boolean;
}

export interface Embroidery {
  id: string;
  name: string;
  surcharge: number | null;
  isActive: boolean;
}

export type ProductType = 'READY_MADE' | 'CUSTOMIZE' | 'SHOWCASE';

export interface ProductCard {
  id: string;
  slug: string;
  name: string;
  designId: string | null;
  type: ProductType;
  basePrice: number;
  compareAtPrice: number | null;
  discountPercent: number | null;
  images: string[];
  tags: string[];
  availability: 'in_stock' | 'out_of_stock' | 'upcoming' | 'showcase';
  totalStock: number;
  expectedAvailability: string | null;
}

export interface ProductVariant {
  id: string;
  productId: string;
  sku: string | null;
  colorId: string;
  sizeId: string;
  price: number;
  discount: number | null;
  stock: number;
  isActive: boolean;
}

export interface ProductDetail extends ProductCard {
  description: string | null;
  categoryId: string;
  subCategoryId: string | null;
  finalPrice: number;
  colors: Color[];
  sizes: Size[];
  variants: ProductVariant[];
  videos: string[];
  category: { id: string; name: string; slug: string } | null;
  subCategory: { id: string; name: string; slug: string } | null;
  fiberOptions: { id: string; name: string; price: number }[];
  embroideryOptions: { id: string; name: string; surcharge: number | null }[];
}

export interface AdminProduct extends ProductDetail {
  isActive: boolean;
  slug: string;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AdminLoginResult {
  token: string;
  expiresIn: number;
  admin: { id: string; name: string; email: string; permissions: string[] };
}

export interface ProductQuery {
  q?: string;
  categoryId?: string;
  subCategoryId?: string;
  colorId?: string;
  sizeId?: string;
  fiberId?: string;
  embroideryId?: string;
  minPrice?: number;
  maxPrice?: number;
  availability?: AvailabilityFilter;
  sort?: SortOption;
}

export const PRICE_RANGES: Array<{ label: string; min?: number; max?: number }> = [
  { label: 'All Prices' },
  { label: 'Under ₹500', max: 500 },
  { label: '₹500 – ₹1000', min: 500, max: 1000 },
  { label: '₹1000 – ₹2000', min: 1000, max: 2000 },
  { label: 'Above ₹2000', min: 2000 },
];