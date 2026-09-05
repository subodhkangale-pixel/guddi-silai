import { useParams } from 'react-router-dom';
import { useState } from 'react';

import Spinner from '../components/Spinner';
import { useProduct } from '../api/hooks';
import { formatPrice } from '../lib/format';

function AvailabilityBadge({
  availability,
}: {
  availability: string;
}) {
  const label: Record<string, string> = {
    in_stock: 'In Stock',
    out_of_stock: 'Out of Stock',
    upcoming: 'Upcoming',
    showcase: 'Showcase',
  };
  const style: Record<string, string> = {
    in_stock: 'bg-green-100 text-green-700',
    out_of_stock: 'bg-red-100 text-red-700',
    upcoming: 'bg-amber-100 text-amber-700',
    showcase: 'bg-gray-100 text-gray-600',
  };
  return (
    <span
      className={`inline-block rounded-full px-3 py-1 text-sm font-medium ${style[availability] ?? style.showcase}`}
    >
      {label[availability] ?? availability}
    </span>
  );
}

function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data, isPending, isError } = useProduct(slug);
  const [activeImage, setActiveImage] = useState(0);

  if (isPending) return <Spinner label="Loading product…" />;
  if (isError || !data) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-gray-500">
        Product not found.
      </div>
    );
  }

  const product = data.data;
  const images = product.images.length ? product.images : [];
  const activeSrc = images[activeImage] ?? '';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Gallery */}
        <div>
          <div className="aspect-[4/5] rounded-lg border border-gray-200 bg-gray-100 overflow-hidden">
            {activeSrc ? (
              <img src={activeSrc} alt={product.name} className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-gray-400">
                No image
              </div>
            )}
          </div>
          {images.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto">
              {images.map((image, index) => (
                <button
                  key={image}
                  onClick={() => setActiveImage(index)}
                  className={`flex-shrink-0 h-20 w-16 overflow-hidden rounded-md border-2 ${
                    activeImage === index ? 'border-purple-600' : 'border-transparent'
                  }`}
                >
                  <img src={image} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div>
          {product.designId && (
            <p className="text-sm font-medium text-purple-600">{product.designId}</p>
          )}
          <h1 className="mt-1 text-2xl font-bold text-gray-900">{product.name}</h1>

          <div className="mt-3 flex items-center gap-3">
            <AvailabilityBadge availability={product.availability} />
            {product.finalPrice < product.basePrice && (
              <span className="text-sm text-green-600">
                {Math.round(
                  (1 - product.finalPrice / product.basePrice) * 100
                )}% off
              </span>
            )}
          </div>

          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-2xl font-bold text-gray-900">
              {formatPrice(product.finalPrice)}
            </span>
            {product.compareAtPrice != null &&
              product.compareAtPrice > product.finalPrice && (
                <span className="text-lg text-gray-400 line-through">
                  {formatPrice(product.compareAtPrice)}
                </span>
              )}
          </div>

          {product.description && (
            <p className="mt-4 text-gray-700 leading-relaxed">{product.description}</p>
          )}

          <div className="mt-6 space-y-4 border-t border-gray-200 pt-6">
            <DetailRow label="Category" value={product.category?.name ?? '—'} />
            <DetailRow label="Sub-category" value={product.subCategory?.name ?? '—'} />
            <DetailRow
              label="Colors"
              value={product.colors.map((c) => c.name).join(', ') || '—'}
            />
            <DetailRow
              label="Sizes"
              value={product.sizes.map((s) => s.name).join(', ') || '—'}
            />
            <DetailRow
              label="Fabric"
              value={product.fiberOptions.map((f) => f.name).join(', ') || '—'}
            />
            <DetailRow
              label="Embroidery"
              value={product.embroideryOptions.map((e) => e.name).join(', ') || '—'}
            />
          </div>

          {product.variants.length > 0 && (
            <div className="mt-6">
              <h2 className="text-sm font-semibold text-gray-900">Variants & Stock</h2>
              <div className="mt-2 overflow-x-auto rounded-md border border-gray-200">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-left text-gray-600">
                    <tr>
                      <th className="px-3 py-2">SKU</th>
                      <th className="px-3 py-2">Color</th>
                      <th className="px-3 py-2">Size</th>
                      <th className="px-3 py-2">Price</th>
                      <th className="px-3 py-2">Stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {product.variants.map((variant) => (
                      <tr key={variant.id} className="border-t border-gray-100">
                        <td className="px-3 py-2">{variant.sku ?? '—'}</td>
                        <td className="px-3 py-2">
                          {product.colors.find((c) => c.id === variant.colorId)?.name ??
                            variant.colorId}
                        </td>
                        <td className="px-3 py-2">
                          {product.sizes.find((s) => s.id === variant.sizeId)?.name ??
                            variant.sizeId}
                        </td>
                        <td className="px-3 py-2">{formatPrice(variant.price)}</td>
                        <td className="px-3 py-2">{variant.stock}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href={`https://wa.me/?text=Hi Guddi Silai! I'm interested in ${encodeURIComponent(
                `${product.designId ?? product.name} (${product.name})`
              )}.`}
              target="_blank"
              rel="noreferrer"
              className="rounded-md bg-green-600 px-6 py-3 text-white text-sm font-medium hover:bg-green-700"
            >
              WhatsApp Enquiry
            </a>
            <a
              href="/products"
              className="rounded-md border border-gray-300 px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Back to Collection
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-4">
      <span className="w-32 flex-shrink-0 text-sm text-gray-500">{label}</span>
      <span className="text-sm text-gray-900">{value}</span>
    </div>
  );
}

export default ProductDetailPage;