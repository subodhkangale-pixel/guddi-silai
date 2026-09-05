import { FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  adminAddVariant,
  adminCreateProduct,
  adminDeleteProduct,
  adminDeleteVariant,
  adminGetProduct,
  adminListProducts,
  adminUploadProductImages,
  adminUpdateVariant,
  adminUpdateProduct,
} from '../../api/catalogApi';
import { useCategories, useColors, useEmbroideries, useFibers, useSizes, useSubCategories } from '../../api/hooks';
import { AdminProduct } from '../../api/types';
import Spinner from '../../components/Spinner';

const PRODUCT_TYPES = ['READY_MADE', 'CUSTOMIZE', 'SHOWCASE'] as const;

interface VariantDraft {
  id?: string;
  colorId: string;
  sizeId: string;
  sku: string;
  price: string;
  stock: string;
}

interface ProductForm {
  name: string;
  designId: string;
  type: (typeof PRODUCT_TYPES)[number];
  description: string;
  categoryId: string;
  subCategoryId: string;
  basePrice: string;
  images: string;
  tags: string;
  colors: string[];
  sizes: string[];
  fiberIds: string[];
  embroideryIds: string[];
}

function emptyForm(): ProductForm {
  return {
    name: '',
    designId: '',
    type: 'READY_MADE',
    description: '',
    categoryId: '',
    subCategoryId: '',
    basePrice: '',
    images: '',
    tags: '',
    colors: [],
    sizes: [],
    fiberIds: [],
    embroideryIds: [],
  };
}

function AdminProducts() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [productId, setProductId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm());
  const [variants, setVariants] = useState<VariantDraft[]>([]);
  const [removedVariantIds, setRemovedVariantIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loadingProductId, setLoadingProductId] = useState<string | null>(null);

  const categories = useCategories();
  const colors = useColors();
  const sizes = useSizes();
  const fibers = useFibers();
  const embroideries = useEmbroideries();

  const productsQuery = useQuery({
    queryKey: ['admin-products', page, search],
    queryFn: () => adminListProducts({ page, limit: 10, q: search || undefined }),
  });

  const subCategories = useSubCategories(form.categoryId);
  const subCategoryOptions = subCategories.data ?? [];

  function refresh() {
    void queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    void queryClient.invalidateQueries({ queryKey: ['products'] });
  }

  function openCreate() {
    setError(null);
    setProductId(null);
    setForm(emptyForm());
    setVariants([]);
    setRemovedVariantIds([]);
    setModalOpen(true);
  }

  async function openEdit(productId: string) {
    setError(null);
    setLoadingProductId(productId);
    try {
      const { data: product } = await adminGetProduct(productId);
      const colors = product.colors as unknown as Array<{ colorId?: string; id?: string }>;
      const sizes = product.sizes as unknown as Array<{ sizeId?: string; id?: string }>;
      setProductId(product.id);
      setForm({
        name: product.name,
        designId: product.designId ?? '',
        type: product.type,
        description: product.description ?? '',
        categoryId: product.categoryId,
        subCategoryId: product.subCategoryId ?? '',
        basePrice: String(product.basePrice),
        images: product.images.join(', '),
        tags: product.tags.join(', '),
        colors: colors.map((color) => color.colorId ?? color.id).filter((id): id is string => Boolean(id)),
        sizes: sizes.map((size) => size.sizeId ?? size.id).filter((id): id is string => Boolean(id)),
        fiberIds: product.fiberOptions.map((fiber) => fiber.id),
        embroideryIds: product.embroideryOptions.map((embroidery) => embroidery.id),
      });
      setVariants(product.variants.map((variant) => ({
        id: variant.id,
        colorId: variant.colorId,
        sizeId: variant.sizeId,
        sku: variant.sku ?? '',
        price: String(variant.price),
        stock: String(variant.stock),
      })));
      setRemovedVariantIds([]);
      setModalOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load product details');
    } finally {
      setLoadingProductId(null);
    }
  }

  function closeModal() {
    setModalOpen(false);
    setProductId(null);
    setVariants([]);
    setRemovedVariantIds([]);
    setError(null);
  }

  const productMutation = useMutation({
    mutationFn: (payload: { id: string | null; body: Record<string, unknown> }) =>
      payload.id
        ? adminUpdateProduct(payload.id, payload.body)
        : adminCreateProduct(payload.body),
    onSuccess: async (result) => {
      const saved = result.data;
      await syncVariants(saved);
      refresh();
      closeModal();
    },
    onError: (err: Error) => setError(err.message),
  });

  const imageUploadMutation = useMutation({
    mutationFn: adminUploadProductImages,
    onSuccess: (result) => {
      setForm((current) => {
        const existing = current.images.split(',').map((value) => value.trim()).filter(Boolean);
        return { ...current, images: [...existing, ...result.data.urls].join(', ') };
      });
    },
    onError: (err: Error) => setError(err.message),
  });

  function uploadImages(files: FileList | null) {
    if (!files?.length) return;
    setError(null);
    imageUploadMutation.mutate(Array.from(files));
  }

  async function syncVariants(saved: AdminProduct) {
    await Promise.all(removedVariantIds.map((id) => adminDeleteVariant(id)));
    for (const draft of variants) {
      const body = {
        colorId: draft.colorId,
        sizeId: draft.sizeId,
        sku: draft.sku || undefined,
        price: Number(draft.price),
        stock: Number(draft.stock) || 0,
      };
      if (draft.id) await adminUpdateVariant(draft.id, body);
      else await adminAddVariant(saved.id, body);
    }
  }

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminDeleteProduct(id),
    onSuccess: refresh,
    onError: (err: Error) => setError(err.message),
  });

  function buildBody(): Record<string, unknown> {
    const body: Record<string, unknown> = {
      name: form.name,
      type: form.type,
      categoryId: form.categoryId,
      basePrice: Number(form.basePrice),
      images: form.images
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      tags: form.tags
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      colors: form.colors,
      sizes: form.sizes,
      fiberIds: form.fiberIds,
      embroideryIds: form.embroideryIds,
      isActive: true,
    };
    if (form.designId) body.designId = form.designId;
    if (form.description) body.description = form.description;
    if (form.subCategoryId) body.subCategoryId = form.subCategoryId;
    return body;
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (form.basePrice === '') {
      setError('Base price is required');
      return;
    }
    productMutation.mutate({ id: productId, body: buildBody() });
  }

  function setVariant(index: number, key: keyof VariantDraft, value: string) {
    setVariants((list) =>
      list.map((draft, i) => (i === index ? { ...draft, [key]: value } : draft))
    );
  }

  function removeVariant(index: number) {
    const draft = variants[index];
    if (draft?.id) setRemovedVariantIds((ids) => [...ids, draft.id!]);
    setVariants((list) => list.filter((_, itemIndex) => itemIndex !== index));
  }

  const records = productsQuery.data?.data.data ?? [];
  const totalPages = productsQuery.data?.data.totalPages ?? 1;
  const imageUrls = form.images.split(',').map((value) => value.trim()).filter(Boolean);

  function removeImage(url: string) {
    setForm((current) => ({
      ...current,
      images: current.images.split(',').map((value) => value.trim()).filter((value) => value && value !== url).join(', '),
    }));
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-4">
        <h1 className="text-xl font-bold text-gray-900">Products</h1>
        <div className="flex items-center gap-3">
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search products…"
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
          <button
            onClick={openCreate}
            className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
          >
            New Product
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        {productsQuery.isPending ? (
          <Spinner label="Loading products…" />
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-600">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Design ID</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                    No products found.
                  </td>
                </tr>
              )}
              {records.map((product) => (
                <tr key={product.id} className="border-t border-gray-100">
                  <td className="px-4 py-3 font-medium text-gray-900">{product.name}</td>
                  <td className="px-4 py-3">{product.designId ?? '—'}</td>
                  <td className="px-4 py-3">{product.type}</td>
                  <td className="px-4 py-3">₹{product.basePrice}</td>
                  <td className="px-4 py-3">{product.totalStock}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => void openEdit(product.id)}
                      disabled={loadingProductId === product.id}
                      className="mr-2 rounded-md border border-gray-300 px-3 py-1 text-xs text-gray-700 hover:bg-gray-50"
                    >
                      {loadingProductId === product.id ? 'Loading…' : 'Edit'}
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`Delete "${product.name}"?`)) {
                          deleteMutation.mutate(product.id);
                        }
                      }}
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
        )}
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-3">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="rounded-md border border-gray-300 px-3 py-1 text-sm disabled:opacity-40"
          >
            Prev
          </button>
          <span className="text-sm text-gray-600">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="rounded-md border border-gray-300 px-3 py-1 text-sm disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 p-4">
          <form
            onSubmit={handleSubmit}
            className="mx-auto mt-8 w-full max-w-2xl rounded-lg bg-white p-6 shadow-lg"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">
                {productId ? 'Edit Product' : 'New Product'}
              </h2>
              <button type="button" onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label="Name (required)">
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="input"
                />
              </FormField>
              <FormField label="Design ID">
                <input
                  type="text"
                  value={form.designId}
                  onChange={(e) => setForm((f) => ({ ...f, designId: e.target.value }))}
                  className="input"
                />
              </FormField>
              <FormField label="Type">
                <select
                  value={form.type}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, type: e.target.value as ProductForm['type'] }))
                  }
                  className="input"
                >
                  {PRODUCT_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label="Category">
                <select
                  value={form.categoryId}
                  required
                  onChange={(e) =>
                    setForm((f) => ({ ...f, categoryId: e.target.value, subCategoryId: '' }))
                  }
                  className="input"
                >
                  <option value="">— Select —</option>
                  {(categories.data ?? []).map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label="Sub-category">
                <select
                  value={form.subCategoryId}
                  onChange={(e) => setForm((f) => ({ ...f, subCategoryId: e.target.value }))}
                  className="input"
                >
                  <option value="">None</option>
                  {subCategoryOptions.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label="Base Price (₹)">
                <input
                  type="number"
                  required
                  min={0}
                  value={form.basePrice}
                  onChange={(e) => setForm((f) => ({ ...f, basePrice: e.target.value }))}
                  className="input"
                />
              </FormField>
              <FormField label="Product images">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  multiple
                  onChange={(e) => {
                    uploadImages(e.target.files);
                    e.target.value = '';
                  }}
                  disabled={imageUploadMutation.isPending}
                  className="input"
                />
                <p className="mt-1 text-xs text-gray-500">
                  {imageUploadMutation.isPending ? 'Uploading images…' : 'Upload up to 10 JPG, PNG, WebP, or AVIF images (8 MB each).'}
                </p>
                <input
                  type="text"
                  value={form.images}
                  onChange={(e) => setForm((f) => ({ ...f, images: e.target.value }))}
                  className="input"
                  placeholder="https://…, https://…"
                />
                {imageUrls.length > 0 && (
                  <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
                    {imageUrls.map((url, index) => (
                      <div key={url} className="relative aspect-square overflow-hidden rounded-md border border-gray-200 bg-gray-50">
                        <img src={url} alt={`Product image ${index + 1}`} className="h-full w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeImage(url)}
                          className="absolute right-1 top-1 rounded bg-white/95 px-1.5 py-0.5 text-xs font-bold text-red-600 shadow hover:bg-white"
                          aria-label={`Remove product image ${index + 1}`}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </FormField>
              <FormField label="Tags (comma-separated)">
                <input
                  type="text"
                  value={form.tags}
                  onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
                  className="input"
                  placeholder="bridal, silk, festive"
                />
              </FormField>
            </div>

            <div className="mt-4">
              <FormField label="Description">
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className="input"
                  rows={3}
                />
              </FormField>
            </div>

            <MultiSelect
              label="Colors"
              options={(colors.data?.data ?? []).map((c) => ({ id: c.id, name: c.name }))}
              selected={form.colors}
              onChange={(selected) => setForm((f) => ({ ...f, colors: selected }))}
            />
            <MultiSelect
              label="Sizes"
              options={(sizes.data?.data ?? []).map((s) => ({ id: s.id, name: s.name }))}
              selected={form.sizes}
              onChange={(selected) => setForm((f) => ({ ...f, sizes: selected }))}
            />
            <MultiSelect
              label="Fibers"
              options={(fibers.data?.data ?? []).map((f) => ({ id: f.id, name: f.name }))}
              selected={form.fiberIds}
              onChange={(selected) => setForm((f) => ({ ...f, fiberIds: selected }))}
            />
            <MultiSelect
              label="Embroidery"
              options={(embroideries.data?.data ?? []).map((e) => ({ id: e.id, name: e.name }))}
              selected={form.embroideryIds}
              onChange={(selected) => setForm((f) => ({ ...f, embroideryIds: selected }))}
            />

            <div className="mt-6">
              <h3 className="mb-2 text-sm font-semibold text-gray-900">Stock Variants</h3>
              {variants.length === 0 && (
                <p className="mb-2 text-sm text-gray-400">
                  No variants yet. Add at least one to make the product purchasable.
                </p>
              )}
              <div className="space-y-2">
                {variants.map((variant, index) => (
                  <div key={variant.id ?? `draft-${index}`} className="flex items-end gap-2">
                    <select
                      value={variant.colorId}
                      onChange={(e) => setVariant(index, 'colorId', e.target.value)}
                      className="input flex-1"
                    >
                      <option value="">Color</option>
                      {(colors.data?.data ?? []).map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    <select
                      value={variant.sizeId}
                      onChange={(e) => setVariant(index, 'sizeId', e.target.value)}
                      className="input flex-1"
                    >
                      <option value="">Size</option>
                      {(sizes.data?.data ?? []).map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="SKU"
                      value={variant.sku}
                      onChange={(e) => setVariant(index, 'sku', e.target.value)}
                      className="input w-32"
                    />
                    <input
                      type="number"
                      placeholder="Price"
                      value={variant.price}
                      onChange={(e) => setVariant(index, 'price', e.target.value)}
                      className="input w-24"
                    />
                    <input
                      type="number"
                      placeholder="Stock"
                      value={variant.stock}
                      onChange={(e) => setVariant(index, 'stock', e.target.value)}
                      className="input w-24"
                    />
                    <button
                      type="button"
                      onClick={() => removeVariant(index)}
                      className="rounded-md p-2 text-red-500 hover:bg-red-50"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() =>
                  setVariants((list) => [
                    ...list,
                    { colorId: '', sizeId: '', sku: '', price: '', stock: '0' },
                  ])
                }
                className="mt-2 rounded-md border border-gray-300 px-3 py-1 text-sm text-gray-700 hover:bg-gray-50"
              >
                + Add variant
              </button>
              <p className="mt-2 text-xs text-gray-400">
                New variant rows are saved automatically after you save the product. Existing
                variants keep their current stock.
              </p>
            </div>

            {error && (
              <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
            )}

            <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-4">
              <button
                type="button"
                onClick={closeModal}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={productMutation.isPending}
                className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
              >
                {productMutation.isPending ? 'Saving…' : 'Save Product'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
      {children}
    </div>
  );
}

function MultiSelect(props: {
  label: string;
  options: Array<{ id: string; name: string }>;
  selected: string[];
  onChange(selected: string[]): void;
}) {
  if (props.options.length === 0) return null;
  return (
    <div className="mt-4">
      <span className="mb-1 block text-sm font-medium text-gray-700">{props.label}</span>
      <div className="flex flex-wrap gap-2">
        {props.options.map((option) => {
          const active = props.selected.includes(option.id);
          return (
            <button
              key={option.id}
              type="button"
              onClick={() =>
                props.onChange(
                  active
                    ? props.selected.filter((id) => id !== option.id)
                    : [...props.selected, option.id]
                )
              }
              className={`rounded-full border px-3 py-1 text-sm ${
                active
                  ? 'border-purple-600 bg-purple-100 text-purple-700'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {option.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default AdminProducts;
