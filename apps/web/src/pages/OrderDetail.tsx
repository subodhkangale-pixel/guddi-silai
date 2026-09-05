import { Link, useParams } from 'react-router-dom';

import Spinner from '../components/Spinner';
import { useOrder } from '../api/hooks';
import { formatPrice } from '../lib/format';
import { flowIndex, isFlowStatus, statusPillClass } from '../lib/order';
import { ORDER_STATUS_FLOW } from '@guddi-silai/shared';

function OrderDetailPage() {
  const { orderNumber } = useParams();
  const orderQuery = useOrder(orderNumber);
  if (orderQuery.isPending) return <Spinner label="Loading order…" />;
  if (orderQuery.isError || !orderQuery.data?.data) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-lg text-red-700">Could not load this order.</p>
        <Link to="/orders" className="mt-4 inline-block font-semibold text-pink-600">Back to my orders →</Link>
      </div>
    );
  }

  const order = orderQuery.data.data;
  const couponDiscount = order.coupon?.discount ?? 0;
  const offerDiscount = order.offer?.discount ?? 0;
  const totalDiscount = couponDiscount + offerDiscount;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <Link to="/orders" className="text-sm font-semibold text-pink-600">← My orders</Link>
      <div className="mt-2 border-b border-gray-200 pb-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-gray-900">Order {order.orderNumber}</h1>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusPillClass(order.status)}`}>{order.status}</span>
        </div>
        <p className="mt-1 text-sm text-gray-500">Placed on {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString()}</p>
      </div>

      {isFlowStatus(order.status) && (
        <OrderTimeline status={order.status} />
      )}

      <section className="mt-8 grid gap-6 sm:grid-cols-2">
        <div className="rounded-lg border border-gray-200 p-5">
          <h2 className="text-sm font-bold uppercase tracking-wide text-gray-500">Delivery address</h2>
          <p className="mt-3 text-sm text-gray-800">{order.customer.name}</p>
          <p className="text-sm text-gray-600">{order.customer.address}</p>
          <p className="text-sm text-gray-600">{order.customer.city}, {order.customer.state} — {order.customer.pincode}</p>
          <p className="mt-1 text-sm text-gray-600">{order.customer.mobile}</p>
          {order.customer.email && <p className="text-sm text-gray-600">{order.customer.email}</p>}
        </div>
        <div className="rounded-lg border border-gray-200 p-5">
          <h2 className="text-sm font-bold uppercase tracking-wide text-gray-500">Payment</h2>
          <div className="mt-3 space-y-1 text-sm text-gray-700">
            <div className="flex justify-between"><span>Method</span><span>{order.payment?.method ?? '—'}</span></div>
            <div className="flex justify-between"><span>Status</span><span>{order.payment?.status ?? 'PENDING'}</span></div>
            <div className="flex justify-between"><span>Amount</span><span>{order.payment ? formatPrice(order.payment.amount) : formatPrice(order.total)}</span></div>
            {order.payment?.transactionId && <div className="flex justify-between"><span>Transaction</span><span className="truncate pl-4">{order.payment.transactionId}</span></div>}
            {order.payment?.paidAt && <div className="flex justify-between"><span>Paid on</span><span>{new Date(order.payment.paidAt).toLocaleString()}</span></div>}
          </div>
        </div>
      </section>

      {order.notes && (
        <section className="mt-6 rounded-lg border border-gray-200 p-5">
          <h2 className="text-sm font-bold uppercase tracking-wide text-gray-500">Order notes</h2>
          <p className="mt-2 text-sm text-gray-700">{order.notes}</p>
        </section>
      )}

      <section className="mt-8">
        <div className="space-y-4">
          {order.items.map((item, index) => (
            <article key={index} className="rounded-lg border border-gray-200 bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-gray-900">{item.productName}</h3>
                  <p className="mt-1 text-sm text-gray-600">
                    {item.productType === 'CUSTOMIZE' ? 'Custom with measurements' : 'Ready to buy'}
                    {item.fiber ? ` · ${item.fiber}` : ''}
                    {item.embroidery ? ` · ${item.embroidery}` : ''}
                    {item.color ? ` · ${item.color}` : ''}
                    {item.size ? ` · Size ${item.size}` : ''}
                  </p>
                  {item.styleOptions && (() => {
                    const entries = Object.entries(item.styleOptions).filter(([, value]) => Boolean(value));
                    if (entries.length === 0) return null;
                    return <p className="mt-1 text-sm text-gray-500">{entries.map(([key, value]) => `${key.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase())}: ${value}`).join(' · ')}</p>;
                  })()}
                </div>
                <div className="text-right text-sm">
                  <p>{formatPrice(item.unitPrice)} × {item.quantity}</p>
                  <p className="mt-1 font-semibold text-gray-900">{formatPrice(item.total)}</p>
                </div>
              </div>
              {item.measurementSnapshot && (
                <div className="mt-4 rounded-md bg-gray-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Measurements · instructions v{item.measurementSnapshot.measurementInstructionVersion}</p>
                  <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1 sm:grid-cols-3">
                    {item.measurementSnapshot.values.map((measurement, mIndex) => (
                      <div key={mIndex} className="flex justify-between text-sm text-gray-700">
                        <span>{measurement.label}</span>
                        <strong>{measurement.value} {measurement.unit}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </article>
          ))}
        </div>
      </section>

      <section className="mt-8 rounded-lg border border-gray-200 p-5">
        <h2 className="text-sm font-bold uppercase tracking-wide text-gray-500">Price summary</h2>
        <div className="mt-3 space-y-2 text-sm text-gray-700">
          <div className="flex justify-between"><span>Subtotal</span><span>{formatPrice(order.subtotal)}</span></div>
          {offerDiscount > 0 && <div className="flex justify-between text-green-700"><span>Offer discount ({order.offer?.name})</span><span>−{formatPrice(offerDiscount)}</span></div>}
          {couponDiscount > 0 && <div className="flex justify-between text-green-700"><span>Coupon ({order.coupon?.code})</span><span>−{formatPrice(couponDiscount)}</span></div>}
          {order.addons && order.addons.length > 0 && <div className="flex justify-between"><span>Add-ons ({order.addons.length})</span><span>+{formatPrice(order.addons.reduce((sum, addon) => sum + addon.price * addon.quantity, 0))}</span></div>}
          <div className="flex justify-between"><span>Shipping</span><span>{order.shipping > 0 ? formatPrice(order.shipping) : 'Free'}</span></div>
          {totalDiscount > 0 && <div className="flex justify-between text-green-700"><span>Total discount</span><span>−{formatPrice(totalDiscount)}</span></div>}
        </div>
        <div className="mt-3 flex justify-between border-t border-gray-200 pt-3 text-lg font-bold text-gray-900">
          <span>Total</span><span>{formatPrice(order.total)}</span>
        </div>
      </section>

      {order.addons && order.addons.length > 0 && (
        <section className="mt-6 rounded-lg border border-gray-200 p-5">
          <h2 className="text-sm font-bold uppercase tracking-wide text-gray-500">Add-ons</h2>
          <div className="mt-3 space-y-2">
            {order.addons.map((addon, index) => (
              <div key={index} className="flex items-baseline justify-between gap-3 text-sm">
                <div><span className="font-medium text-gray-900">{addon.name}</span>{addon.description && <span className="block text-xs text-gray-500">{addon.description}</span>}</div>
                <span className="whitespace-nowrap text-gray-700">{formatPrice(addon.price)} {addon.quantity > 1 ? `× ${addon.quantity}` : ''}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function OrderTimeline({ status }: { status: string }) {
  const current = flowIndex(status);
  return (
    <ol className="mt-6 flex items-center gap-1 overflow-x-auto rounded-lg border border-gray-200 bg-white p-4">
      {ORDER_STATUS_FLOW.map((step) => {
        const index = flowIndex(step);
        const reached = index <= current;
        return (
          <li key={step} className="flex items-center gap-1">
            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${reached ? 'bg-pink-600 text-white' : 'bg-gray-100 text-gray-400'}`}>{step.replace(/_/g, ' ')}</span>
            {index < ORDER_STATUS_FLOW.length - 1 && <span className={`h-px w-4 ${index < current ? 'bg-pink-600' : 'bg-gray-200'}`} />}
          </li>
        );
      })}
    </ol>
  );
}

export default OrderDetailPage;