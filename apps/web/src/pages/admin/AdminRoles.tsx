import { FormEvent, useState } from 'react';

import { useAdminPermissions, useAdminRoleMutations, useAdminRoles } from '../../api/hooks';
import { AdminPermissionItem, AdminRole, AdminRoleInput } from '../../api/adminManagementApi';
import Spinner from '../../components/Spinner';

function AdminRoles() {
  const { data, isPending, isError } = useAdminRoles();
  const permissions = useAdminPermissions();
  const { create, update, remove } = useAdminRoleMutations();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<AdminRole | null>(null);
  const [form, setForm] = useState<AdminRoleInput>({ name: '', description: '', permissionKeys: [] });
  const [error, setError] = useState<string | null>(null);

  const roles = data?.data ?? [];
  const permissionList = permissions.data?.data ?? [];
  const busy = create.isPending || update.isPending || remove.isPending;

  function readError(e: unknown) {
    const message = (e as { message?: string })?.message;
    return message ?? 'Something went wrong. Try again.';
  }

  function openCreate() {
    setError(null);
    setForm({ name: '', description: '', permissionKeys: [] });
    setCreating(true);
  }

  function openEdit(role: AdminRole) {
    setError(null);
    setForm({
      name: role.name,
      description: role.description ?? '',
      permissionKeys: role.permissions.map((permission) => permission.key),
    });
    setEditing(role);
  }

  function togglePermission(key: string) {
    setForm((f) => ({
      ...f,
      permissionKeys: f.permissionKeys.includes(key)
        ? f.permissionKeys.filter((permissionKey) => permissionKey !== key)
        : [...f.permissionKeys, key],
    }));
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    const payload: AdminRoleInput = {
      name: form.name,
      description: form.description?.trim() || null,
      permissionKeys: form.permissionKeys,
    };
    if (editing) update.mutate({ id: editing.id, input: payload }, { onError: (err) => setError(readError(err)) });
    else create.mutate(payload, { onError: (err) => setError(readError(err)) });
    setCreating(false);
    setEditing(null);
  }

  function handleDelete(role: AdminRole) {
    if (role.isSystem) return;
    if (window.confirm(`Delete role ${role.name}? Admins with this role will keep their other roles.`)) {
      remove.mutate(role.id, { onError: (err) => setError(readError(err)) });
    }
  }

  function groupLabel(key: string) {
    return key.split(':')[0] ?? key;
  }

  const groupedPermissions = new Map<string, AdminPermissionItem[]>();
  for (const permission of permissionList) {
    const group = groupLabel(permission.key);
    const list = groupedPermissions.get(group) ?? [];
    list.push(permission);
    groupedPermissions.set(group, list);
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Roles & permissions</h1>
        <button
          onClick={openCreate}
          className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
        >
          New role
        </button>
      </div>

      {error && <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      {(creating || editing) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form onSubmit={handleSubmit} className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-6 shadow-lg">
            <h2 className="mb-4 text-lg font-bold text-gray-900">
              {editing ? `Edit ${editing.name}` : 'New role'}
            </h2>
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">
                Role name *
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm uppercase"
                />
              </label>
              <label className="block text-sm font-medium text-gray-700">
                Description
                <textarea
                  value={form.description ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  rows={2}
                />
              </label>
              <div>
                <span className="text-sm font-medium text-gray-700">Permissions</span>
                <div className="mt-2 space-y-3">
                  {Array.from(groupedPermissions.entries()).map(([group, items]) => (
                    <div key={group}>
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{group}</p>
                      <div className="mt-1 space-y-1">
                        {items.map((permission) => (
                          <label key={permission.id} className="flex items-start gap-2 text-sm text-gray-700">
                            <input
                              type="checkbox"
                              checked={form.permissionKeys.includes(permission.key)}
                              onChange={() => togglePermission(permission.key)}
                              className="mt-0.5 h-4 w-4 accent-purple-600"
                            />
                            <span>
                              <span className="font-medium">{permission.name}</span>
                              {permission.description && (
                                <span className="block text-xs text-gray-400">{permission.description}</span>
                              )}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                  {permissionList.length === 0 && (
                    <p className="text-xs text-gray-400">No permissions available.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => { setCreating(false); setEditing(null); }}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy}
                className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      )}

      {isPending && <Spinner label="Loading roles…" />}
      {isError && <p className="mt-4 text-sm text-red-700">Could not load roles.</p>}
      {!isPending && !isError && roles.length === 0 && (
        <p className="mt-6 text-sm text-gray-500">No roles yet.</p>
      )}

      {!isPending && !isError && roles.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-600">
              <tr>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Permissions</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {roles.map((role) => (
                <tr key={role.id} className="border-t border-gray-100">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{role.name}</p>
                    {role.description && <p className="text-xs text-gray-400">{role.description}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex max-w-md flex-wrap gap-1">
                      {role.permissions.map((permission) => (
                        <span key={permission.id} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                          {permission.key}
                        </span>
                      ))}
                      {role.permissions.length === 0 && <span className="text-xs text-gray-400">No permissions</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${role.isSystem ? 'bg-purple-50 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                      {role.isSystem ? 'System' : 'Custom'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => openEdit(role)}
                      className="mr-2 rounded-md border border-gray-300 px-3 py-1 text-xs text-gray-700 hover:bg-gray-50"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(role)}
                      disabled={role.isSystem || remove.isPending}
                      className="rounded-md border border-red-200 px-3 py-1 text-xs text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {role.isSystem ? 'System' : 'Delete'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default AdminRoles;