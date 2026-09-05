import { FormEvent, useState } from 'react';

import { useAdminOfferMutations, useAdminOffers } from '../../api/hooks';
import { Offer, OfferInput } from '../../api/offerApi';
import { formatPrice, formatDate } from '../../lib/format';
import Spinner from '../../components/Spinner';

function emptyForm(): OfferInput {
  return { name: '', type: 'PERCENT', value: 0 };
}

function AdminOffers() {
  const { data, isPending, isError } = useAdminOffers();
  const { create, deactivate } = useAdminOfferMutations();
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<OfferInput>(emptyForm);
  const [error, setError] = useState<string | null>(null);

  const offers = data?.data ?? [];

  function openCreate() {
    setError(null);
    setForm(emptyForm());
    setCreating(true);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    create.mutate(
      {
        name: form.name,
        description: form.description?.trim() || undefined,
        type: form.type,
        value: Number(form.value),
        startDate: form.startDate ? new Date(form.startDate + 'T00:00:00').toISOString() : undefined,
        endDate: form.endDate ? new Date(form.endDate + 'T23:59:59').toISOString() : undefined,
      },
      {
        onSuccess: () => setCreating(false),
        onError: (err: Error) => setError(err.message),
      }
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Offers</h1>
        <button
          onClick={openCreate}
          className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
        >
          New offer
        </button>
      </div>

      {creating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form onSubmit={handleSubmit} className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
            <h2 className="mb-4 text-lg font-bold text-gray-900">New offer</h2>
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
                Description
                <textarea
                  value={form.description ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={2}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-sm font-medium text-gray-700">
                  Type *
                  <select
                    value={form.type}
                    onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as OfferInput['type'] }))}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  >
                    <option value="PERCENT">Percent (%)</option>
                    <option value="FIXED">Fixed (₹)</option>
                    <option value="FESTIVAL">Festival</option>
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
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-sm font-medium text-gray-700">
                  Starts on
                  <input
                    type="date"
                    value={form.startDate ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                </label>
                <label className="block text-sm font-medium text-gray-700">
                  Ends on
                  <input
                    type="date"
                    value={form.endDate ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                </label>
              </div>
            </div>

            {error && <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setCreating(false)}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={create.isPending}
                className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
              >
                {create.isPending ? 'Creating…' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      )}

      {isPending && <Spinner label="Loading offers…" />}
      {isError && <p className="mt-4 text-sm text-red-700">Could not load offers.</p>}
      {!isPending && !isError && offers.length === 0 && (
        <p className="mt-6 text-sm text-gray-500">No offers yet. Create one to auto-apply a discount at checkout.</p>
      )}

      {!isPending && !isError && offers.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-600">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Value</th>
                <th className="px-4 py-3">Window</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {offers.map((offer) => (
                <tr key={offer.id} className="border-t border-gray-100">
                  <td className="px-4 py-3 font-medium">{offer.name}</td>
                  <td className="px-4 py-3">{offer.type}</td>
                  <td className="px-4 py-3">
                    {offer.type === 'PERCENT' ? `${offer.value}%` : formatPrice(offer.value)}
                  </td>
                  <td className="px-4 py-3">
                    {offer.startDate || offer.endDate ? (
                      <span>
                        {offer.startDate ? formatDate(offer.startDate) : 'anys'} →{' '}
                        {offer.endDate ? formatDate(offer.endDate) : 'anys'}
                      </span>
                    ) : (
                      'Always'
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${offer.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {offer.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {offer.isActive ? (
                      <button
                        onClick={() => {
                          if (window.confirm(`Deactivate "${offer.name}"?`)) deactivate.mutate(offer.id);
                        }}
                        disabled={deactivate.isPending}
                        className="rounded-md border border-red-200 px-3 py-1 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50"
                      >
                        Deactivate
                      </button>
                    ) : (
                      <span className="text-xs text-gray-400">Stopped</span>
                    )}
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

export default AdminOffers;