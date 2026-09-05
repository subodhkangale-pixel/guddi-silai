import { useState } from 'react';

import { adminListOrders, adminUpdateOrderStatus } from '../../api/admin';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ORDER_STATUSES } from '@guddi-silai/shared';
import { formatPrice } from '../../lib/format';
import Spinner from '../../components/Spinner';

function AdminOrders() {
  const [status, setStatus] = useState('');
  const queryClient = useQueryClient();
  const orders = useQuery({ queryKey: ['admin-orders', status], queryFn: () => adminListOrders(status || undefined) });
  const update = useMutation({ mutationFn: ({ id, nextStatus }: { id: string; nextStatus: string }) => adminUpdateOrderStatus(id, nextStatus), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-orders'] }) });
  if (orders.isPending) return <Spinner label="Loading orders…" />;
  return <div><div className="flex flex-wrap items-end justify-between gap-3"><div><h1 className="text-2xl font-bold text-gray-900">Orders</h1><p className="mt-1 text-sm text-gray-600">Review and update customer orders.</p></div><select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"><option value="">All statuses</option>{ORDER_STATUSES.map((value) => <option key={value} value={value}>{value}</option>)}</select></div>{orders.isError ? <p className="mt-6 text-red-700">Could not load orders.</p> : <div className="mt-6 space-y-3">{(orders.data?.data ?? []).map((order) => <article key={order.id} className="rounded-lg border border-gray-200 bg-white p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-semibold text-gray-900">{order.orderNumber}</h2><p className="text-sm text-gray-600">{order.customer.name} · {order.customer.mobile} · {order.customer.city}</p></div><strong>{formatPrice(order.total)}</strong></div><div className="mt-3 flex flex-wrap items-center gap-3 border-t border-gray-100 pt-3"><span className="text-sm text-gray-600">Current: {order.status}</span><select value={order.status} onChange={(event) => update.mutate({ id: order.id, nextStatus: event.target.value })} className="rounded border border-gray-300 px-2 py-1 text-sm">{ORDER_STATUSES.map((value) => <option key={value} value={value}>{value}</option>)}</select></div></article>)}</div>}</div>;
}

export default AdminOrders;