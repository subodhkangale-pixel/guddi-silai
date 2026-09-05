import { useState } from 'react';

import { useAdminActivity } from '../../api/hooks';
import { formatDate } from '../../lib/format';
import Spinner from '../../components/Spinner';

const ACTIONS = [
  'ADMIN_USER_CREATE',
  'ADMIN_USER_UPDATE',
  'ADMIN_USER_REMOVE',
  'ADMIN_ROLE_CREATE',
  'ADMIN_ROLE_UPDATE',
  'ADMIN_ROLE_REMOVE',
];

function AdminLogs() {
  const [action, setAction] = useState('');
  const { data, isPending, isError, refetch, isFetching } = useAdminActivity(
    action ? { action } : {}
  );
  const logs = data?.data?.logs ?? [];
  const total = data?.data?.total ?? 0;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Activity log</h1>
          <p className="mt-1 text-sm text-gray-600">Audit trail of admin actions. Showing {logs.length} of {total}.</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={action}
            onChange={(e) => setAction(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700"
          >
            <option value="">All actions</option>
            {ACTIONS.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Refresh
          </button>
        </div>
      </div>

      {isPending && <Spinner label="Loading activity…" />}
      {isError && <p className="mt-4 text-sm text-red-700">Could not load activity log.</p>}
      {!isPending && !isError && logs.length === 0 && (
        <p className="mt-6 text-sm text-gray-500">No activity recorded{action ? ' for this action' : ''} yet.</p>
      )}

      {!isPending && !isError && logs.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-600">
              <tr>
                <th className="px-4 py-3">When</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Admin</th>
                <th className="px-4 py-3">Target</th>
                <th className="px-4 py-3">IP</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-t border-gray-100">
                  <td className="px-4 py-3 whitespace-nowrap text-gray-600">{formatDate(log.createdAt)}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-700">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {log.admin ? (
                      <div>
                        <p className="font-medium text-gray-900">{log.admin.name}</p>
                        <p className="text-xs text-gray-400">{log.admin.email}</p>
                      </div>
                    ) : (
                      <span className="text-gray-400">{log.adminUserId}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600">
                    {log.targetType && (
                      <>
                        <span className="font-medium">{log.targetType}</span>
                        {' / '}
                        <span className="font-mono">{log.targetId}</span>
                      </>
                    )}
                    {!log.targetType && <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{log.ipAddress ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default AdminLogs;