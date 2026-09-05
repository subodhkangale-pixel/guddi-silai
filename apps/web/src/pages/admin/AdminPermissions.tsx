import { useAdminPermissions } from '../../api/hooks';
import Spinner from '../../components/Spinner';

function AdminPermissions() {
  const { data, isPending, isError } = useAdminPermissions();
  const permissions = data?.data ?? [];

  const groups = new Map<string, typeof permissions>();
  for (const permission of permissions) {
    const group = permission.key.split(':')[0] ?? permission.key;
    const list = groups.get(group) ?? [];
    list.push(permission);
    groups.set(group, list);
  }

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-xl font-bold text-gray-900">Permissions</h1>
        <p className="mt-1 text-sm text-gray-600">
          The complete permission registry. Permissions are assigned to roles; roles are assigned to admins.
        </p>
      </div>

      {isPending && <Spinner label="Loading permissions…" />}
      {isError && <p className="mt-4 text-sm text-red-700">Could not load permissions.</p>}
      {!isPending && !isError && permissions.length === 0 && (
        <p className="mt-6 text-sm text-gray-500">No permissions found.</p>
      )}

      {!isPending && !isError && permissions.length > 0 && (
        <div className="space-y-6">
          {Array.from(groups.entries()).map(([group, items]) => (
            <div key={group}>
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-400">{group}</h2>
              <div className="divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white">
                {items.map((permission) => (
                  <div key={permission.id} className="flex items-start justify-between gap-4 px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{permission.name}</p>
                      {permission.description && <p className="mt-0.5 text-xs text-gray-500">{permission.description}</p>}
                    </div>
                    <code className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{permission.key}</code>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AdminPermissions;