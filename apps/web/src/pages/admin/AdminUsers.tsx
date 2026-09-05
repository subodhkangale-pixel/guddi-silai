import { FormEvent, useState } from 'react';

import { useAdminRoles, useAdminUserMutations, useAdminUsers } from '../../api/hooks';
import { AdminRole, AdminUser, AdminUserInput } from '../../api/adminManagementApi';
import { formatDate } from '../../lib/format';
import Spinner from '../../components/Spinner';

function AdminUsers() {
  const { data, isPending, isError } = useAdminUsers();
  const roles = useAdminRoles();
  const { create, update, remove } = useAdminUserMutations();
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<AdminUserInput>({ name: '', email: '', password: '', roleIds: [] });
  const [error, setError] = useState<string | null>(null);

  const users = data?.data ?? [];
  const roleList = roles.data?.data ?? [];
  const busy = create.isPending || update.isPending || remove.isPending;

  function readError(e: unknown) {
    const message = (e as { message?: string })?.message;
    return message ?? 'Something went wrong. Try again.';
  }

  function openCreate() {
    setError(null);
    setForm({ name: '', email: '', password: '', roleIds: [] });
    setCreating(true);
  }

  function openEdit(user: AdminUser) {
    setError(null);
    setForm({ name: user.name, email: user.email, password: '', roleIds: [...user.roleIds] });
    setEditing(user);
  }

  function toggleRole(roleId: string) {
    setForm((f) => ({
      ...f,
      roleIds: f.roleIds.includes(roleId) ? f.roleIds.filter((id) => id !== roleId) : [...f.roleIds, roleId],
    }));
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    const payload: Partial<AdminUserInput> & { isActive?: boolean } = {
      name: form.name,
      email: form.email,
      roleIds: form.roleIds,
    };
    if (form.password) payload.password = form.password;
    if (editing) {
      update.mutate({ id: editing.id, input: payload }, {
        onError: (err) => setError(readError(err)),
      });
    } else {
      create.mutate(payload as AdminUserInput, {
        onError: (err) => setError(readError(err)),
      });
    }
    setCreating(false);
    setEditing(null);
  }

  function toggleActive(user: AdminUser) {
    update.mutate({ id: user.id, input: { isActive: !user.isActive } });
  }

  function handleDelete(user: AdminUser) {
    if (window.confirm(`Delete admin ${user.email}? This cannot be undone.`)) {
      remove.mutate(user.id, {
        onError: (err) => setError(readError(err)),
      });
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Admin users</h1>
        <button
          onClick={openCreate}
          className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
        >
          New admin
        </button>
      </div>

      {error && <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      {(creating || editing) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form onSubmit={handleSubmit} className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
            <h2 className="mb-4 text-lg font-bold text-gray-900">
              {editing ? `Edit ${editing.name}` : 'New admin user'}
            </h2>
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">
                Name *
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
              </label>
              <label className="block text-sm font-medium text-gray-700">
                Email *
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
              </label>
              <label className="block text-sm font-medium text-gray-700">
                Password {editing ? '(leave blank to keep)' : '*'}
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
              </label>
              <div>
                <span className="text-sm font-medium text-gray-700">Roles *</span>
                <div className="mt-2 space-y-2">
                  {roleList.map((role) => (
                    <label key={role.id} className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={form.roleIds.includes(role.id)}
                        onChange={() => toggleRole(role.id)}
                        className="h-4 w-4 accent-purple-600"
                      />
                      <span className="font-medium">{role.name}</span>
                      {role.description && <span className="text-xs text-gray-400">— {role.description}</span>}
                    </label>
                  ))}
                  {roleList.length === 0 && (
                    <p className="text-xs text-gray-400">No roles found. Create roles first.</p>
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
                disabled={busy || form.roleIds.length === 0}
                className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      )}

      {isPending && <Spinner label="Loading users…" />}
      {isError && <p className="mt-4 text-sm text-red-700">Could not load users.</p>}
      {!isPending && !isError && users.length === 0 && (
        <p className="mt-6 text-sm text-gray-500">No admin users yet.</p>
      )}

      {!isPending && !isError && users.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-600">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Roles</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-t border-gray-100">
                  <td className="px-4 py-3 font-medium text-gray-900">{user.name}</td>
                  <td className="px-4 py-3">{user.email}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {user.roleNames.length === 0 && <span className="text-xs text-gray-400">No roles</span>}
                      {user.roleNames.map((name) => (
                        <span key={name} className="rounded-full bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-700">
                          {name}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${user.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {user.isActive ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="px-4 py-3">{formatDate(user.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => openEdit(user)}
                      className="mr-2 rounded-md border border-gray-300 px-3 py-1 text-xs text-gray-700 hover:bg-gray-50"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => toggleActive(user)}
                      disabled={update.isPending}
                      className="mr-2 rounded-md border border-gray-300 px-3 py-1 text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                      {user.isActive ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      onClick={() => handleDelete(user)}
                      disabled={remove.isPending}
                      className="rounded-md border border-red-200 px-3 py-1 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      Delete
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

export default AdminUsers;