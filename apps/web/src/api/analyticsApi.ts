import { apiRequest } from './client';
import { apiRequestAuth } from './admin';

const SESSION_KEY = 'guddi-silai-analytics-session';

function sessionId() {
  const existing = window.localStorage.getItem(SESSION_KEY);
  if (existing) return existing;
  const created = crypto.randomUUID();
  window.localStorage.setItem(SESSION_KEY, created);
  return created;
}

export function trackEvent(input: { type: string; productId?: string; properties?: Record<string, unknown> }) {
  return apiRequest('/analytics/events', {
    method: 'POST',
    body: { ...input, sessionId: sessionId() },
  }).catch(() => undefined);
}

export interface DashboardTopProduct {
  productId: string;
  name: string;
  designId: string | null;
  slug: string | null;
  image: string | null;
  views: number;
  carts: number;
  orders: number;
  likes: number;
  score: number;
}

export interface DashboardData {
  range: { from: string | null; to: string | null };
  visitors: number;
  productsTracked: number;
  eventCounts: Record<string, number>;
  funnel: {
    PAGE_VIEW: number;
    PRODUCT_VIEW: number;
    CART_ADD: number;
    CHECKOUT_START: number;
    ORDER_PLACED: number;
    PAYMENT_SUCCESS: number;
  };
  topProducts: DashboardTopProduct[];
  trend: { days: string[]; views: number[]; carts: number[]; orders: number[] };
  revenue: { amount: number; orders: number };
}

export interface AnalyticsRange {
  from?: string;
  to?: string;
  days?: number;
}

export function getAnalyticsDashboard(range: AnalyticsRange = {}) {
  const params: Record<string, string | number | boolean | undefined> = {};
  if (range.from) params.from = range.from;
  if (range.to) params.to = range.to;
  if (range.days) {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - (range.days - 1));
    params.from = from.toISOString();
    params.to = to.toISOString();
  }
  return apiRequestAuth<{ data: DashboardData }>('/analytics/dashboard', { query: params });
}
