import { useState } from 'react';

import { adminGetOrder, adminListOrders, adminUpdateOrderStatus } from '../../api/admin';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ORDER_STATUSES } from '@guddi-silai/shared';
import { formatPrice } from '../../lib/format';
import { statusPillClass } from '../../lib/order';
import Spinner from '../../components/Spinner';
import { Order } from '../../api/orderApi';

function AdminOrders() {
  const [status, setStatus] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const orders = useQuery({ queryKey: ['admin-orders', status], queryFn: () => adminListOrders(status || undefined) });
  const detail = useQuery({
    queryKey: ['admin-order', selectedId],
    queryFn: () => adminGetOrder(selectedId!),
    enabled: Boolean(selectedId),
  });
  const update = useMutation({
    mutationFn: ({ id, nextStatus }: { id: string; nextStatus: string }) => adminUpdateOrderStatus(id, nextStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin-order'] });
    },
  });
  if (orders.isPending) return <Spinner label="Loading orders…" />;
  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="mt-1 text-sm text-gray-600">Review and update customer orders.</p>
        </div>
        <select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm">
          <option value="">All statuses</option>
          {ORDER_STATUSES.map((value) => <option key={value} value={value}>{value}</option>)}
        </select>
      </div>
      {orders.isError ? <p className="mt-6 text-red-700">Could not load orders.</p> : <div className="mt-6 space-y-3">
        {(orders.data?.data ?? []).map((order) => (
          <div key={order.id} className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold text-gray-900">{order.orderNumber}</h2>
                <p className="text-sm text-gray-600">{order.customer.name} · {order.customer.mobile} · {order.customer.city}, {order.customer.state}</p>
                <p className="mt-1 text-xs text-gray-500">{new Date(order.createdAt).toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusPillClass(order.status)}`}>{order.status}</span>
                <strong>{formatPrice(order.total)}</strong>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-gray-100 pt-3">
              <span className="text-sm text-gray-600">Update status:</span>
              <select value={order.status} onChange={(event) => update.mutate({ id: order.id, nextStatus: event.target.value })} className="rounded border border-gray-300 px-2 py-1 text-sm">
                {ORDER_STATUSES.map((value) => <option key={value} value={value}>{value}</option>)}
              </select>
              <button
                type="button"
                onClick={() => setSelectedId(selectedId === order.id ? null : order.id)}
                className="ml-auto rounded-md border border-gray-300 px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                {selectedId === order.id ? 'Hide details' : 'View details'}
              </button>
            </div>
            {selectedId === order.id && <OrderDetailPanel orderQuery={detail} />}
          </div>
        ))}
      </div>}
    </div>
  );
}

function OrderDetailPanel({ orderQuery }: { orderQuery: { isPending: boolean; isError: boolean; data?: { data?: Order } } }) {
  if (orderQuery.isPending) return <div className="mt-4 border-t border-gray-100 pt-4"><Spinner label="Loading details…" /></div>;
  if (orderQuery.isError || !orderQuery.data?.data) return <p className="mt-4 text-sm text-red-700">Could not load order details.</p>;
  const order = orderQuery.data.data;
  const couponDiscount = order.coupon?.discount ?? 0;
  const offerDiscount = order.offer?.discount ?? 0;
  return (
    <div className="mt-4 space-y-4 border-t border-gray-100 pt-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-md bg-gray-50 p-4">
          <h3 className="text-xs font-bold uppercase tracking-wide text-gray-500">Customer</h3>
          <p className="mt-2 text-sm text-gray-800">{order.customer.name} · {order.customer.mobile}</p>
          {order.customer.email && <p className="text-sm text-gray-600">{order.customer.email}</p>}
          <p className="mt-1 text-sm text-gray-600">{order.customer.address}</p>
          <p className="text-sm text-gray-600">{order.customer.city}, {order.customer.state} — {order.customer.pincode}</p>
        </div>
        <div className="rounded-md bg-gray-50 p-4">
          <h3 className="text-xs font-bold uppercase tracking-wide text-gray-500">Payment</h3>
          <div className="mt-2 space-y-1 text-sm text-gray-700">
            <div className="flex justify-between"><span>Method</span><span>{order.payment?.method ?? '—'}</span></div>
            <div className="flex justify-between"><span>Status</span><span>{order.payment?.status ?? 'PENDING'}</span></div>
            <div className="flex justify-between"><span>Amount</span><span>{order.payment ? formatPrice(order.payment.amount) : formatPrice(order.total)}</span></div>
            {order.payment?.transactionId && <div className="flex justify-between"><span>Transaction</span><span className="truncate pl-4">{order.payment.transactionId}</span></div>}
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-xs font-bold uppercase tracking-wide text-gray-500">Items ({order.items.length})</h3>
        <div className="mt-2 space-y-3">
          {order.items.map((item, index) => (
            <div key={index} className="rounded-md border border-gray-200 p-3 text-sm">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-gray-900">{item.productName}</p>
                  <p className="text-gray-600">
                    {item.productType === 'CUSTOMIZE' ? 'Custom' : 'Ready'} · {item.quantity} × {formatPrice(item.unitPrice)}
                    {item.fiber ? ` · ${item.fiber}` : ''}
                    {item.embroidery ? ` · ${item.embroidery}` : ''}
                    {item.color ? ` · ${item.color}` : ''}
                    {item.size ? ` · ${item.size}` : ''}
                  </p>
                  {item.styleOptions && (() => {
                    const entries = Object.entries(item.styleOptions).filter(([, value]) => Boolean(value));
                    if (entries.length === 0) return null;
                    return <p className="mt-0.5 text-xs text-gray-500">{entries.map(([key, value]) => `${key.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase())}: ${value}`).join(' · ')}</p>;
                  })()}
                </div>
                <strong>{formatPrice(item.total)}</strong>
              </div>
              {item.measurementSnapshot && (
                <div className="mt-2 rounded bg-gray-50 p-2">
                  <p className="text-xs font-semibold text-gray-500">Measurements · instructions v{item.measurementSnapshot.measurementInstructionVersion}</p>
                  <div className="mt-1 grid grid-cols-2 gap-x-4 gap-y-0.5 sm:grid-cols-3">
                    {item.measurementSnapshot.values.map((measurement, mIndex) => (
                      <div key={mIndex} className="flex justify-between text-gray-700">
                        <span>{measurement.label}</span>
                        <strong>{measurement.value} {measurement.unit}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1 text-sm text-gray-700">
          <div className="flex justify-between gap-8"><span>Subtotal</span><span>{formatPrice(order.subtotal)}</span></div>
          {offerDiscount > 0 && <div className="flex justify-between gap-8 text-green-700"><span>Offer ({order.offer?.name})</span><span>−{formatPrice(offerDiscount)}</span></div>}
          {couponDiscount > 0 && <div className="flex justify-between gap-8 text-green-700"><span>Coupon ({order.coupon?.code})</span><span>−{formatPrice(couponDiscount)}</span></div>}
          {order.addons && order.addons.length > 0 && <div className="flex justify-between gap-8"><span>Add-ons ({order.addons.length})</span><span>+{formatPrice(order.addons.reduce((sum, addon) => sum + addon.price * addon.quantity, 0))}</span></div>}
          <div className="flex justify-between gap-8"><span>Shipping</span><span>{order.shipping > 0 ? formatPrice(order.shipping) : 'Free'}</span></div>
        </div>
        <div className="text-lg font-bold text-gray-900">Total: {formatPrice(order.total)}</div>
      </div>

      {order.notes && (
        <div className="rounded-md bg-gray-50 p-3 text-sm">
          <span className="font-semibold text-gray-500">Notes:</span> <span className="text-gray-700">{order.notes}</span>
        </div>
      )}

      {order.addons && order.addons.length > 0 && (
        <div className="rounded-md bg-gray-50 p-3 text-sm">
          <span className="font-semibold text-gray-500">Add-ons:</span>
          <div className="mt-1 space-y-0.5">
            {order.addons.map((addon, index) => (
              <div key={index} className="flex items-baseline justify-between gap-3">
                <span className="text-gray-700">{addon.name}{addon.description ? <span className="block text-xs text-gray-500">{addon.description}</span> : null}</span>
                <strong className="whitespace-nowrap">{formatPrice(addon.price)} {addon.quantity > 1 ? `× ${addon.quantity}` : ''}</strong>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminOrders;