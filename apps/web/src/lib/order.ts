import { ORDER_STATUS_FLOW } from '@guddi-silai/shared';

const STATUS_PILL: Record<string, string> = {
  PLACED: 'bg-blue-100 text-blue-800',
  CONFIRMED: 'bg-sky-100 text-sky-800',
  PROCESSING: 'bg-violet-100 text-violet-800',
  STITCHING: 'bg-purple-100 text-purple-800',
  QUALITY_CHECK: 'bg-indigo-100 text-indigo-800',
  PACKED: 'bg-teal-100 text-teal-800',
  SHIPPED: 'bg-cyan-100 text-cyan-800',
  DELIVERED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
  RETURNED: 'bg-orange-100 text-orange-800',
  FAILED: 'bg-rose-100 text-rose-800',
};

export function statusPillClass(status: string): string {
  return STATUS_PILL[status] ?? 'bg-gray-100 text-gray-800';
}

export function flowIndex(status: string): number {
  return ORDER_STATUS_FLOW.indexOf(status as (typeof ORDER_STATUS_FLOW)[number]);
}

export function isFlowStatus(status: string): boolean {
  return flowIndex(status) >= 0;
}