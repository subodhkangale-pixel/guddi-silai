import { FormEvent, useState } from 'react';

import { useAdminCouponMutations, useAdminCoupons } from '../../api/hooks';
import { Coupon, CouponInput } from '../../api/couponApi';
import { formatPrice, formatDate } from '../../lib/format';
import Spinner from '../../components/Spinner';

function emptyForm(): CouponInput {
  return { code: '', type: 'PERCENT', value: 0 };
}

function AdminCoupons() {
  const { data, isPending, isError } = useAdminCoupons();
  const { create, update, remove } = useAdminCouponMutations();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [form, setForm] = useState<CouponInput>(emptyForm);
  const [error, setError] = useState<string | null>(null);

  const coupons = data?.data ?? [];
  const busy = create.isPending || update.isPending || remove.isPending;

  function openCreate() {
    setError(null);
    setForm(emptyForm());
    setCreating(true);
  }

  function openEdit(coupon: Coupon) {
    setError(null);
    setForm({
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      minOrderAmount: coupon.minOrderAmount ?? undefined,
      maxDiscount: coupon.maxDiscount ?? undefined,
      usageLimit: coupon.usageLimit ?? undefined,
      expiresAt: coupon.expiresAt ? coupon.expiresAt.slice(0, 10) : undefined,
    });
    setEditing(coupon);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    const payload: CouponInput = {
      code: form.code,
      type: form.type,
      value: Number(form.value),
      ...(form.minOrderAmount ? { minOrderAmount: Number(form.minOrderAmount) } : {}),
      ...(form.maxDiscount ? { maxDiscount: Number(form.maxDiscount) } : {}),
      ...(form.usageLimit ? { usageLimit: Number(form.usageLimit) } : {}),
      ...(form.expiresAt ? { expiresAt: new Date(form.expiresAt + 'T23:59:59').toISOString() } : {}),
    };
    if (editing) update.mutate({ id: editing.id, input: payload });
    else create.mutate(payload);
    setCreating(false);
    setEditing(null);
  }

  function handleDelete(coupon: Coupon) {
    if (window.confirm(`Delete coupon ${coupon.code}? This cannot be undone.`)) {
      remove.mutate(coupon.id);
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Coupons</h1>
        <button
          onClick={openCreate}
          className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
        >
          New coupon
        </button>
      </div>

      {(creating || editing) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form onSubmit={handleSubmit} className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
            <h2 className="mb-4 text-lg font-bold text-gray-900">
              {editing ? `Edit ${editing.code}` : 'New coupon'}
            </h2>
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">
                Code *
                <input
                  required
                  value={form.code}
                  onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm uppercase"
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-sm font-medium text-gray-700">
                  Type *
                  <select
                    value={form.type}
                    onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as CouponInput['type'] }))}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  >
                    <option value="PERCENT">Percent (%)</option>
                    <option value="FIXED">Fixed (₹)</option>
                  </select>
                </label>
                <label className="block text-sm font-medium text-gray-700">
                  Value *
                  <input
                    required
                    type="number"
                    min={1}
                    value={form.value}
                    onChange={(e) => setForm((f) => ({ ...f, value: Number(e.target.value) }))}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                </label>
              </div>
              <label className="block text-sm font-medium text-gray-700">
                Minimum order amount (₹)
                <input
                  type="number"
                  min={0}
                  value={form.minOrderAmount ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, minOrderAmount: e.target.value ? Number(e.target.value) : undefined }))}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
              </label>
              <label className="block text-sm font-medium text-gray-700">
                Max discount (₹)
                <input
                  type="number"
                  min={1}
                  value={form.maxDiscount ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, maxDiscount: e.target.value ? Number(e.target.value) : undefined }))}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
              </label>
              <label className="block text-sm font-medium text-gray-700">
                Usage limit
                <input
                  type="number"
                  min={1}
                  value={form.usageLimit ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, usageLimit: e.target.value ? Number(e.target.value) : undefined }))}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
              </label>
              <label className="block text-sm font-medium text-gray-700">
                Expires on
                <input
                  type="date"
                  value={form.expiresAt ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
              </label>
            </div>

            {error && <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}

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

      {isPending && <Spinner label="Loading coupons…" />}
      {isError && <p className="mt-4 text-sm text-red-700">Could not load coupons.</p>}
      {!isPending && !isError && coupons.length === 0 && (
        <p className="mt-6 text-sm text-gray-500">No coupons yet. Create one to offer a discount.</p>
      )}

      {!isPending && !isError && coupons.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-600">
              <tr>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Value</th>
                <th className="px-4 py-3">Used</th>
                <th className="px-4 py-3">Expires</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((coupon) => (
                <tr key={coupon.id} className="border-t border-gray-100">
                  <td className="px-4 py-3 font-mono font-medium">{coupon.code}</td>
                  <td className="px-4 py-3">{coupon.type}</td>
                  <td className="px-4 py-3">
                    {coupon.type === 'PERCENT' ? `${coupon.value}%` : formatPrice(coupon.value)}
                  </td>
                  <td className="px-4 py-3">
                    {coupon.usedCount}
                    {coupon.usageLimit != null ? ` / ${coupon.usageLimit}` : ''}
                  </td>
                  <td className="px-4 py-3">{coupon.expiresAt ? formatDate(coupon.expiresAt) : '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${coupon.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {coupon.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => openEdit(coupon)}
                      className="mr-2 rounded-md border border-gray-300 px-3 py-1 text-xs text-gray-700 hover:bg-gray-50"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(coupon)}
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

export default AdminCoupons;