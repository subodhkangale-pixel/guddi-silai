import { Link } from 'react-router-dom';

import Spinner from '../components/Spinner';
import { useOrders } from '../api/hooks';
import { formatPrice } from '../lib/format';

function OrdersPage() {
  const orders = useOrders();
  if (orders.isPending) return <Spinner label="Loading orders…" />;
  if (orders.isError) return <div className="mx-auto max-w-3xl px-4 py-16 text-center text-red-700">Could not load your orders.</div>;
  const items = orders.data?.data ?? [];
  return <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8"><div className="border-b border-gray-200 pb-5"><p className="text-sm font-semibold uppercase tracking-wide text-pink-600">Your account</p><h1 className="mt-1 text-3xl font-bold text-gray-900">My orders</h1></div>{items.length === 0 ? <div className="py-20 text-center"><p className="text-lg text-gray-700">No orders yet.</p><Link to="/products" className="mt-4 inline-block font-semibold text-pink-600">Explore designs →</Link></div> : <div className="mt-8 space-y-4">{items.map((order) => <article key={order.id} className="rounded-lg border border-gray-200 bg-white p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-semibold text-gray-900">{order.orderNumber}</h2><p className="mt-1 text-sm text-gray-500">{order.createdAt ? new Date(order.createdAt).toLocaleDateString() : ''}</p></div><span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">{order.status}</span></div><div className="mt-4 flex justify-between border-t border-gray-100 pt-3 text-sm"><span>Payment: {order.payment?.status ?? 'PENDING'}</span><strong>{formatPrice(order.total)}</strong></div></article>)}</div>}</div>;
}

export default OrdersPage;