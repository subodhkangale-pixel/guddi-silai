import { Link } from 'react-router-dom';

import Spinner from '../components/Spinner';
import { useMarkNotificationRead, useNotifications } from '../api/hooks';

function NotificationsPage() {
  const notifications = useNotifications();
  const markRead = useMarkNotificationRead();
  if (notifications.isPending) return <Spinner label="Loading notifications…" />;
  if (notifications.isError) return <div className="mx-auto max-w-3xl px-4 py-16 text-center text-red-700">Could not load notifications.</div>;
  const items = notifications.data?.data ?? [];
  return <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8"><div className="border-b border-gray-200 pb-5"><p className="text-sm font-semibold uppercase tracking-wide text-pink-600">Your account</p><h1 className="mt-1 text-3xl font-bold text-gray-900">Notifications</h1></div>{items.length === 0 ? <div className="py-20 text-center"><p className="text-gray-700">No notifications yet.</p><Link to="/products" className="mt-4 inline-block font-semibold text-pink-600">Continue browsing →</Link></div> : <div className="mt-6 space-y-3">{items.map((item) => <article key={item.id} className={`rounded-lg border p-4 ${item.isRead ? 'border-gray-200 bg-white' : 'border-pink-200 bg-pink-50'}`}><div className="flex items-start justify-between gap-3"><div><h2 className="font-semibold text-gray-900">{item.title}</h2><p className="mt-1 text-sm text-gray-700">{item.message}</p><p className="mt-2 text-xs text-gray-500">{new Date(item.createdAt).toLocaleString()}</p></div>{!item.isRead && <button type="button" onClick={() => markRead.mutate(item.id)} className="text-xs font-semibold text-pink-700 underline">Mark read</button>}</div></article>)}</div>}</div>;
}

export default NotificationsPage;