import { FormEvent, useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { adminCreate, adminDelete, adminList, adminUpdate } from '../../api/catalogApi';
import { useCategories } from '../../api/hooks';
import Spinner from '../../components/Spinner';
import { ENTITY_CONFIGS } from './entityConfig';

function CatalogueCrud({ entity }: { entity: keyof typeof ENTITY_CONFIGS }) {
  const config = ENTITY_CONFIGS[entity];
  const queryClient = useQueryClient();
  const categories = useCategories();

  const { data, isPending, isError } = useQuery({
    queryKey: [config.queryKey],
    queryFn: () => adminList(config.path),
  });

  const [editing, setEditing] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<Record<string, string | number | boolean>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (entity === 'subcategories') {
      const categoriesData = categories.data ?? [];
      const field = config.fields.find((f) => f.key === 'categoryId');
      if (field) {
        field.options = categoriesData.map((category) => ({
          value: category.id,
          label: category.name,
        }));
      }
    }
  }, [entity, categories.data, config]);

  function refresh() {
    void queryClient.invalidateQueries({ queryKey: [config.queryKey] });
    void queryClient.invalidateQueries({ queryKey: [config.queryKey, 'products'] });
  }

  const createMutation = useMutation({
    mutationFn: (body: unknown) => adminCreate(config.path, body),
    onSuccess: () => {
      setCreating(false);
      setForm({});
      refresh();
    },
    onError: (err: Error) => setError(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: (body: unknown) => adminUpdate(`${config.path}/${editing}`, body),
    onSuccess: () => {
      setEditing(null);
      setForm({});
      refresh();
    },
    onError: (err: Error) => setError(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminDelete(`${config.path}/${id}`),
    onSuccess: refresh,
    onError: (err: Error) => setError(err.message),
  });

  function openCreate() {
    setError(null);
    setForm({});
    setCreating(true);
  }

  function openEdit(record: Record<string, unknown>) {
    setError(null);
    const initial: Record<string, string | number | boolean> = {};
    for (const field of config.fields) {
      initial[field.key] = record[field.key] as string | number | boolean;
    }
    setForm(initial);
    setEditing(record.id as string);
  }

  function openDelete(record: Record<string, unknown>) {
    const name = String(record.name ?? record.id);
    const confirmed = window.confirm(`Delete "${name}"? This cannot be undone.`);
    if (confirmed) {
      deleteMutation.mutate(String(record.id));
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    const payload: Record<string, unknown> = { ...form };
    if (!config.fields.some((f) => f.key === 'isActive')) {
      payload.isActive = true;
    }
    if (editing) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  }

  if (isPending) return <Spinner label={`Loading ${config.title}…`} />;
  if (isError) {
    return (
      <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
        Could not load {config.title}.
      </div>
    );
  }

  const records = data?.data ?? [];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">{config.title}</h1>
        <button
          onClick={openCreate}
          className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
        >
          Add {config.title.replace(/ies$/, 'y').replace(/s$/, '')}
        </button>
      </div>

      {(creating || editing) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg"
          >
            <h2 className="mb-4 text-lg font-bold text-gray-900">
              {editing ? `Edit ${config.title}` : `New ${config.title}`}
            </h2>
            <div className="space-y-4">
              {config.fields.map((field) => {
                if (field.type === 'checkbox') {
                  return (
                    <label key={field.key} className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={Boolean(form[field.key])}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, [field.key]: e.target.checked }))
                        }
                        className="rounded border-gray-300"
                      />
                      {field.label}
                    </label>
                  );
                }
                const value = (form[field.key] as string | number) ?? '';
                return (
                  <div key={field.key}>
                    <label className="block text-sm font-medium text-gray-700">
                      {field.label}
                      {field.required && <span className="text-red-500"> *</span>}
                    </label>
                    {field.type === 'select' ? (
                      <select
                        value={String(value)}
                        required={field.required}
                        onChange={(e) => setForm((f) => ({ ...f, [field.key]: e.target.value }))}
                        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                      >
                        <option value="">— Select —</option>
                        {(field.options ?? []).map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    ) : field.type === 'textarea' ? (
                      <textarea
                        value={String(value)}
                        onChange={(e) => setForm((f) => ({ ...f, [field.key]: e.target.value }))}
                        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                        rows={3}
                      />
                    ) : (
                      <input
                        type={field.type === 'number' ? 'number' : 'text'}
                        value={String(value)}
                        required={field.required}
                        placeholder={field.placeholder}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            [field.key]:
                              field.type === 'number'
                                ? Number(e.target.value)
                                : e.target.value,
                          }))
                        }
                        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {error && (
              <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setCreating(false);
                  setEditing(null);
                  setForm({});
                }}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-600">
            <tr>
              {config.fields.slice(0, 3).map((field) => (
                <th key={field.key} className="px-4 py-3">
                  {field.label}
                </th>
              ))}
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {records.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                  Nothing here yet. Add your first {config.title.toLowerCase()} to get started.
                </td>
              </tr>
            )}
            {records.map((record) => (
              <tr key={record.id} className="border-t border-gray-100">
                {config.fields.slice(0, 3).map((field) => (
                  <td key={field.key} className="px-4 py-3">
                    {field.key === 'categoryId'
                      ? String(
                          (categories.data ?? []).find(
                            (c) => c.id === record.categoryId
                          )?.name ?? record.categoryId ?? ''
                        )
                      : String(record[field.key] ?? '')}
                  </td>
                ))}
                <td className="px-4 py-3">
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                      record.isActive
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {record.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => openEdit(record)}
                    className="mr-2 rounded-md border border-gray-300 px-3 py-1 text-xs text-gray-700 hover:bg-gray-50"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => openDelete(record)}
                    disabled={deleteMutation.isPending}
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
    </div>
  );
}

export default CatalogueCrud;