import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

import { getAdminNotifications, markAdminNotificationRead } from '../../api/adminNotificationApi';
import Spinner from '../../components/Spinner';

function AdminNotifications() {
  const queryClient = useQueryClient();
  const notifications = useQuery({ queryKey: ['admin-notifications'], queryFn: getAdminNotifications });
  const markRead = useMutation({
    mutationFn: markAdminNotificationRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-notifications'] }),
  });
  if (notifications.isPending) return <Spinner label="Loading notifications…" />;
  const items = notifications.data?.data ?? [];
  const unread = items.filter((item) => !item.isRead).length;
  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="mt-1 text-sm text-gray-600">Order updates and store activity.</p>
        </div>
        {unread > 0 && <span className="rounded-full bg-purple-600 px-3 py-1 text-xs font-semibold text-white">{unread} unread</span>}
      </div>
      {notifications.isError ? <p className="mt-6 text-red-700">Could not load notifications.</p> : items.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-gray-700">No notifications yet.</p>
          <Link to="/admin/orders" className="mt-4 inline-block font-semibold text-purple-600">Go to orders →</Link>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {items.map((item) => (
            <article key={item.id} className={`rounded-lg border p-4 ${item.isRead ? 'border-gray-200 bg-white' : 'border-purple-200 bg-purple-50'}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-gray-900">{item.title}</h2>
                  <p className="mt-1 text-sm text-gray-700">{item.message}</p>
                  <p className="mt-2 text-xs text-gray-500">{new Date(item.createdAt).toLocaleString()}</p>
                </div>
                {!item.isRead && <button type="button" onClick={() => markRead.mutate(item.id)} className="text-xs font-semibold text-purple-700 underline">Mark read</button>}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export default AdminNotifications;