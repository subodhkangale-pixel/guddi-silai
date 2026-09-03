// ─── Guddi Silai — Shared Types ───
// Domain constants, capability registry, and utility types

// ──────────────────────────────────────────────
// Product Types
// ──────────────────────────────────────────────

export const PRODUCT_TYPES = ['READY_MADE', 'CUSTOMIZE', 'SHOWCASE'] as const;
export type ProductType = (typeof PRODUCT_TYPES)[number];

export function isValidProductType(value: string): value is ProductType {
  return PRODUCT_TYPES.includes(value as ProductType);
}

// ──────────────────────────────────────────────
// Product Capability Registry (ADR-008)
// ──────────────────────────────────────────────

export interface ProductCapabilities {
  purchasable: boolean;
  requiresMeasurements: boolean;
  requiresFiber: boolean;
  requiresInventory: boolean;
  customizationEnabled: boolean;
}

export const PRODUCT_CAPABILITIES: Record<ProductType, ProductCapabilities> = {
  READY_MADE: {
    purchasable: true,
    requiresMeasurements: false,
    requiresFiber: false,
    requiresInventory: true,
    customizationEnabled: false,
  },
  CUSTOMIZE: {
    purchasable: true,
    requiresMeasurements: true,
    requiresFiber: true,
    requiresInventory: true,
    customizationEnabled: true,
  },
  SHOWCASE: {
    purchasable: false,
    requiresMeasurements: false,
    requiresFiber: false,
    requiresInventory: false,
    customizationEnabled: false,
  },
};

// ──────────────────────────────────────────────
// Order Statuses (PDF §35, §42)
// ──────────────────────────────────────────────

export const ORDER_STATUSES = [
  'PLACED',
  'CONFIRMED',
  'PROCESSING',
  'STITCHING',
  'QUALITY_CHECK',
  'PACKED',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
  'RETURNED',
  'FAILED',
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_FLOW: readonly OrderStatus[] = [
  'PLACED',
  'CONFIRMED',
  'PROCESSING',
  'STITCHING',
  'QUALITY_CHECK',
  'PACKED',
  'SHIPPED',
  'DELIVERED',
] as const;

export const ORDER_TERMINAL_STATUSES: readonly OrderStatus[] = [
  'CANCELLED',
  'RETURNED',
  'FAILED',
] as const;

export function isValidOrderStatus(value: string): value is OrderStatus {
  return ORDER_STATUSES.includes(value as OrderStatus);
}

// ──────────────────────────────────────────────
// Coupon Types
// ──────────────────────────────────────────────

export const COUPON_TYPES = ['PERCENT', 'FIXED'] as const;
export type CouponType = (typeof COUPON_TYPES)[number];

// ──────────────────────────────────────────────
// Payment
// ──────────────────────────────────────────────

export const PAYMENT_METHODS = ['RAZORPAY', 'COD', 'UPI', 'NET_BANKING'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_STATUSES = [
  'PENDING',
  'SUCCESS',
  'FAILED',
  'REFUNDED',
  'PARTIALLY_REFUNDED',
] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

// ──────────────────────────────────────────────
// Measurement
// ──────────────────────────────────────────────

export const MEASUREMENT_UNITS = ['INCHES', 'CM'] as const;
export type MeasurementUnit = (typeof MEASUREMENT_UNITS)[number];

export const DEFAULT_MEASUREMENT_FIELDS = [
  { key: 'bust', label: 'Bust', displayOrder: 0 },
  { key: 'under_bust', label: 'Under Bust', displayOrder: 1 },
  { key: 'waist', label: 'Waist', displayOrder: 2 },
  { key: 'shoulder', label: 'Shoulder', displayOrder: 3 },
  { key: 'blouse_length', label: 'Blouse Length', displayOrder: 4 },
  { key: 'sleeve_length', label: 'Sleeve Length', displayOrder: 5 },
  { key: 'armhole', label: 'Armhole', displayOrder: 6 },
  { key: 'upper_arm', label: 'Upper Arm', displayOrder: 7 },
  { key: 'sleeve_opening', label: 'Sleeve Opening', displayOrder: 8 },
  { key: 'front_neck_depth', label: 'Front Neck Depth', displayOrder: 9 },
  { key: 'back_neck_depth', label: 'Back Neck Depth', displayOrder: 10 },
] as const;

// ──────────────────────────────────────────────
// Analytics Events (PDF §76–§78)
// ──────────────────────────────────────────────

export const ANALYTICS_EVENT_TYPES = [
  'PAGE_VIEW',
  'PRODUCT_VIEW',
  'PRODUCT_VIEW_START',
  'PRODUCT_VIEW_END',
  'PRODUCT_IMAGE_VIEW',
  'IMAGE_ZOOM',
  'SEARCH',
  'CATEGORY_VIEW',
  'WISHLIST_ADD',
  'CART_ADD',
  'CART_REMOVE',
  'BUY_NOW',
  'CHECKOUT_START',
  'MEASUREMENT_START',
  'MEASUREMENT_COMPLETE',
  'WHATSAPP_CLICK',
  'SHARE',
  'ORDER_PLACED',
  'PAYMENT_SUCCESS',
  'PAYMENT_FAILED',
] as const;

export type AnalyticsEventType = (typeof ANALYTICS_EVENT_TYPES)[number];

// ──────────────────────────────────────────────
// Admin RBAC Roles (PDF §62, ADR-013)
// ──────────────────────────────────────────────

export const ADMIN_ROLES = [
  'SUPER_ADMIN',
  'ORDER_MANAGER',
  'PRODUCT_MANAGER',
  'STITCHING_MANAGER',
  'ANALYST',
] as const;

export type AdminRoleName = (typeof ADMIN_ROLES)[number];

// ──────────────────────────────────────────────
// Base Utility Types
// ──────────────────────────────────────────────

export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CursorPaginationParams {
  cursor?: string;
  limit: number;
}

export interface CursorPaginatedResponse<T> {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

// ──────────────────────────────────────────────
// API Response Types
// ──────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  message?: string;
  statusCode: number;
}

// ──────────────────────────────────────────────
// Cart Types (Phase 7 reference)
// ──────────────────────────────────────────────

export const CART_ITEM_TYPES = ['READY_MADE', 'CUSTOMIZE'] as const;
export type CartItemType = (typeof CART_ITEM_TYPES)[number];

// ──────────────────────────────────────────────
// Inventory Movement Types
// ──────────────────────────────────────────────

export const STOCK_MOVEMENT_TYPES = [
  'ORDER_PLACED',
  'ORDER_CANCELLED',
  'ORDER_RETURNED',
  'ADMIN_ADJUSTMENT',
  'RESTOCK',
] as const;

export type StockMovementType = (typeof STOCK_MOVEMENT_TYPES)[number];

// ──────────────────────────────────────────────
// Review Status
// ──────────────────────────────────────────────

export const REVIEW_STATUSES = ['pending', 'approved', 'rejected'] as const;
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];
