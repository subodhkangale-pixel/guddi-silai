import { FormEvent, useState } from 'react';

import { useAdminAddonMutations, useAdminAddons } from '../../api/hooks';
import { Addon, AdminAddonInput } from '../../api/addonApi';
import { formatPrice } from '../../lib/format';
import Spinner from '../../components/Spinner';

function emptyForm(): AdminAddonInput {
  return { name: '', description: '', price: 0, displayOrder: 0, isActive: true };
}

function AdminAddons() {
  const { data, isPending, isError } = useAdminAddons();
  const { create, update, remove } = useAdminAddonMutations();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Addon | null>(null);
  const [form, setForm] = useState<AdminAddonInput>(emptyForm);

  const addons = data?.data ?? [];
  const busy = create.isPending || update.isPending || remove.isPending;

  function openCreate() {
    setForm(emptyForm());
    setCreating(true);
  }

  function openEdit(addon: Addon) {
    setForm({
      name: addon.name,
      description: addon.description ?? '',
      price: addon.price,
      displayOrder: addon.displayOrder,
      isActive: addon.isActive,
    });
    setEditing(addon);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const payload: AdminAddonInput = {
      name: form.name,
      description: form.description,
      price: Number(form.price),
      displayOrder: Number(form.displayOrder || 0),
      isActive: form.isActive,
    };
    if (editing) update.mutate({ id: editing.id, input: payload });
    else create.mutate(payload);
    setCreating(false);
    setEditing(null);
  }

  function handleDelete(addon: Addon) {
    if (window.confirm(`Delete add-on "${addon.name}"? This cannot be undone.`)) {
      remove.mutate(addon.id);
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Add-ons</h1>
        <button onClick={openCreate} className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700">
          New add-on
        </button>
      </div>

      {(creating || editing) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form onSubmit={handleSubmit} className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
            <h2 className="mb-4 text-lg font-bold text-gray-900">{editing ? `Edit ${editing.name}` : 'New add-on'}</h2>
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">
                Name *
                <input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
              </label>
              <label className="block text-sm font-medium text-gray-700">
                Description
                <textarea value={form.description ?? ''} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={2} className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-sm font-medium text-gray-700">
                  Price (₹) *
                  <input required type="number" min={0} value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value) }))} className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
                </label>
                <label className="block text-sm font-medium text-gray-700">
                  Display order
                  <input type="number" min={0} value={form.displayOrder ?? 0} onChange={(e) => setForm((f) => ({ ...f, displayOrder: Number(e.target.value) }))} className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
                </label>
              </div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} />
                Active (shown to customers)
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => { setCreating(false); setEditing(null); }} className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
              <button type="submit" disabled={busy} className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50">Save</button>
            </div>
          </form>
        </div>
      )}

      {isPending && <Spinner label="Loading add-ons…" />}
      {isError && <p className="mt-4 text-sm text-red-700">Could not load add-ons.</p>}
      {!isPending && !isError && addons.length === 0 && <p className="mt-6 text-sm text-gray-500">No add-ons yet. Create one to offer extras at checkout.</p>}

      {!isPending && !isError && addons.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-600">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {addons.map((addon) => (
                <tr key={addon.id} className="border-t border-gray-100">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{addon.name}</p>
                    {addon.description && <p className="text-xs text-gray-500">{addon.description}</p>}
                  </td>
                  <td className="px-4 py-3">{formatPrice(addon.price)}</td>
                  <td className="px-4 py-3">{addon.displayOrder}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${addon.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {addon.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => openEdit(addon)} className="mr-2 rounded-md border border-gray-300 px-3 py-1 text-xs text-gray-700 hover:bg-gray-50">Edit</button>
                    <button onClick={() => handleDelete(addon)} disabled={remove.isPending} className="rounded-md border border-red-200 px-3 py-1 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50">Delete</button>
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

export default AdminAddons;