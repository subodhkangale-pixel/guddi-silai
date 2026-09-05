import { Link } from 'react-router-dom';

import Spinner from '../components/Spinner';
import { useOrders } from '../api/hooks';
import { formatPrice } from '../lib/format';
import { statusPillClass } from '../lib/order';

function OrdersPage() {
  const orders = useOrders();
  if (orders.isPending) return <Spinner label="Loading orders…" />;
  if (orders.isError) return <div className="mx-auto max-w-3xl px-4 py-16 text-center text-red-700">Could not load your orders.</div>;
  const items = orders.data?.data ?? [];
  return <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8"><div className="border-b border-gray-200 pb-5"><p className="text-sm font-semibold uppercase tracking-wide text-pink-600">Your account</p><h1 className="mt-1 text-3xl font-bold text-gray-900">My orders</h1></div>{items.length === 0 ? <div className="py-20 text-center"><p className="text-lg text-gray-700">No orders yet.</p><Link to="/products" className="mt-4 inline-block font-semibold text-pink-600">Explore designs →</Link></div> : <div className="mt-8 space-y-4">{items.map((order) => <Link key={order.id} to={`/orders/${order.orderNumber}`} className="block rounded-lg border border-gray-200 bg-white p-5 transition hover:border-pink-300 hover:shadow-sm"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-semibold text-gray-900">{order.orderNumber}</h2><p className="mt-1 text-sm text-gray-500">{order.createdAt ? new Date(order.createdAt).toLocaleDateString() : ''}</p><p className="mt-1 text-sm text-gray-500">{order.items?.length ?? 0} item(s)</p></div><span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusPillClass(order.status)}`}>{order.status}</span></div><div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 text-sm"><span className="text-gray-600">Payment: {order.payment?.status ?? 'PENDING'} · {order.payment?.method ?? ''}</span><strong className="text-gray-900">{formatPrice(order.total)}</strong></div></Link>)}</div>}</div>;
}

export default OrdersPage;