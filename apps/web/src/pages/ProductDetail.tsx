import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';

import Spinner from '../components/Spinner';
import { useAddCartItem, useFiberAvailability, useProduct } from '../api/hooks';
import { formatPrice } from '../lib/format';
import { useWishlist } from '../hooks/useWishlist';
import { trackEvent } from '../api/analyticsApi';

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
  const addToCart = useAddCartItem();
  const wishlist = useWishlist();
  const [activeImage, setActiveImage] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [selectedVariantId, setSelectedVariantId] = useState<string>();
  const [selectedFiberId, setSelectedFiberId] = useState<string>();
  const [selectedColorId, setSelectedColorId] = useState<string>();
  const [selectedEmbroideryId, setSelectedEmbroideryId] = useState<string>();
  const productIdForAvailability = data?.data?.type === 'CUSTOMIZE' ? data.data.id : undefined;
  const fiberAvailabilityQuery = useFiberAvailability(productIdForAvailability);

  useEffect(() => {
    if (data?.data) void trackEvent({ type: 'PRODUCT_VIEW', productId: data.data.id });
  }, [data?.data]);

  useEffect(() => {
    if (!data?.data) return;
    const product = data.data;
    const previousTitle = document.title;
    document.title = `${product.name} | Guddi Silai`;
    const description = product.description ?? `${product.name} by Guddi Silai. Design ${product.designId ?? ''}`;
    let descriptionTag = document.querySelector('meta[name="description"]');
    if (!descriptionTag) {
      descriptionTag = document.createElement('meta');
      descriptionTag.setAttribute('name', 'description');
      document.head.appendChild(descriptionTag);
    }
    descriptionTag.setAttribute('content', description);
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', window.location.href);
    const structuredData = document.createElement('script');
    structuredData.type = 'application/ld+json';
    structuredData.textContent = JSON.stringify({ '@context': 'https://schema.org', '@type': 'Product', name: product.name, sku: product.designId ?? product.id, description, image: product.images, offers: { '@type': 'Offer', priceCurrency: 'INR', price: product.finalPrice, availability: product.availability === 'in_stock' ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock' } });
    document.head.appendChild(structuredData);
    return () => {
      document.title = previousTitle;
      structuredData.remove();
    };
  }, [data?.data]);

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
  const selectedVariant = product.variants.find((variant) => variant.id === selectedVariantId) ?? product.variants[0];
  const selectedFiber = product.fiberOptions.find((fiber) => fiber.id === selectedFiberId) ?? product.fiberOptions[0];
  const selectedEmbroidery = product.embroideryOptions.find((embroidery) => embroidery.id === selectedEmbroideryId);

  const fiberColorStock = fiberAvailabilityQuery.data?.data?.find((entry) => entry.fiberId === selectedFiber?.id)?.colors.find((color) => color.colorId === selectedColorId)?.stock;
  const fabricUnavailable = product.type === 'CUSTOMIZE' && product.colors.length > 0 && selectedColorId ? (fiberColorStock ?? 0) <= 0 : false;
  const customUnitPrice = product.type === 'CUSTOMIZE'
    ? product.basePrice + (selectedFiber?.price ?? 0) + (selectedEmbroidery?.surcharge ?? 0)
    : product.finalPrice;

  function handleAddToCart() {
    addToCart.mutate({
      productId: product.id,
      productType: product.type as 'READY_MADE' | 'CUSTOMIZE',
      variantId: product.type === 'READY_MADE' ? selectedVariant?.id : undefined,
      fiberId: product.type === 'CUSTOMIZE' ? selectedFiber?.id : undefined,
      colorId: product.type === 'CUSTOMIZE' ? selectedColorId : undefined,
      embroideryId: product.type === 'CUSTOMIZE' ? selectedEmbroidery?.id : undefined,
    });
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Gallery */}
        <div>
          <div className="relative aspect-[4/5] overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
            {activeSrc ? (
              <img
                src={activeSrc}
                alt={product.name}
                onWheel={(event) => {
                  event.preventDefault();
                  setZoom((value) => Math.min(3, Math.max(1, value - event.deltaY / 1000)));
                }}
                className="h-full w-full object-cover transition-transform duration-150"
                style={{ transform: `scale(${zoom})` }}
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-gray-400">
                No image
              </div>
            )}
            {activeSrc && (
              <div className="absolute bottom-3 right-3 flex overflow-hidden rounded-md border border-gray-200 bg-white/95 shadow-sm">
                <button type="button" onClick={() => setZoom((value) => Math.min(3, value + 0.25))} className="px-3 py-1 text-lg">+</button>
                <button type="button" onClick={() => setZoom(1)} className="border-l border-gray-200 px-2 py-1 text-xs">Reset</button>
                <button type="button" onClick={() => setZoom((value) => Math.max(1, value - 0.25))} className="border-l border-gray-200 px-3 py-1 text-lg">−</button>
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

          {product.type === 'READY_MADE' && product.variants.length > 0 && (
            <label className="mt-6 block text-sm font-medium text-gray-700">
              Choose color and size
              <select
                value={selectedVariant?.id ?? ''}
                onChange={(event) => setSelectedVariantId(event.target.value)}
                className="mt-2 block w-full rounded-md border border-gray-300 bg-white px-3 py-2"
              >
                {product.variants.map((variant) => (
                  <option key={variant.id} value={variant.id} disabled={variant.stock === 0}>
                    {product.colors.find((color) => color.id === variant.colorId)?.name ?? 'Color'} / {product.sizes.find((size) => size.id === variant.sizeId)?.name ?? 'Size'}{variant.stock === 0 ? ' — Out of stock' : ''}
                  </option>
                ))}
              </select>
            </label>
          )}

          {product.type === 'CUSTOMIZE' && (
            <div className="mt-6 space-y-4 rounded-lg border border-amber-200 bg-amber-50/50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">Customize your blouse</p>
            {product.colors.length > 0 && (
              <label className="block text-sm font-medium text-gray-700">
                Choose fabric color
                <select value={selectedColorId ?? ''} onChange={(event) => setSelectedColorId(event.target.value)} className="mt-2 block w-full rounded-md border border-gray-300 bg-white px-3 py-2">
                  <option value="">Select a color</option>
                  {product.colors.map((color) => {
                    const stock = fiberAvailabilityQuery.data?.data?.find((entry) => entry.fiberId === selectedFiber?.id)?.colors.find((entry) => entry.colorId === color.id)?.stock;
                    return <option key={color.id} value={color.id}>{color.name}{stock !== undefined ? ` — ${stock > 0 ? `${stock} available` : 'Out of stock'}` : ''}</option>;
                  })}
                </select>
              </label>
            )}
            <label className="block text-sm font-medium text-gray-700">
              Choose fabric
              <select
                value={selectedFiber?.id ?? ''}
                onChange={(event) => setSelectedFiberId(event.target.value)}
                className="mt-2 block w-full rounded-md border border-gray-300 bg-white px-3 py-2"
              >
                {product.fiberOptions.map((fiber) => (
                  <option key={fiber.id} value={fiber.id}>{fiber.name} (+{formatPrice(fiber.price)})</option>
                ))}
              </select>
            </label>
            {product.embroideryOptions.length > 0 && (
              <label className="block text-sm font-medium text-gray-700">
                Embroidery (optional)
                <select value={selectedEmbroideryId ?? ''} onChange={(event) => setSelectedEmbroideryId(event.target.value || undefined)} className="mt-2 block w-full rounded-md border border-gray-300 bg-white px-3 py-2">
                  <option value="">None</option>
                  {product.embroideryOptions.map((embroidery) => (
                    <option key={embroidery.id} value={embroidery.id}>{embroidery.name}{embroidery.surcharge ? ` (+${formatPrice(embroidery.surcharge)})` : ''}</option>
                  ))}
                </select>
              </label>
            )}
            <div className="rounded-md bg-white p-3 text-sm text-gray-700">
              <div className="flex justify-between"><span>Base price</span><span>{formatPrice(product.basePrice)}</span></div>
              {selectedFiber && <div className="flex justify-between"><span>Fabric ({selectedFiber.name})</span><span>+{formatPrice(selectedFiber.price)}</span></div>}
              {selectedEmbroidery && <div className="flex justify-between"><span>Embroidery ({selectedEmbroidery.name})</span><span>+{formatPrice(selectedEmbroidery.surcharge ?? 0)}</span></div>}
              <div className="mt-2 flex justify-between border-t border-gray-200 pt-2 font-bold text-gray-900"><span>Unit price</span><span>{formatPrice(customUnitPrice)}</span></div>
            </div>
            {fabricUnavailable && <p className="text-xs font-medium text-red-700">This fabric color is currently out of stock. Pick another combination.</p>}
            </div>
          )}

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => wishlist.toggle(product)}
              className="rounded-md border border-gray-300 px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              {wishlist.isSaved(product.id) ? '♥ Saved' : '♡ Save'}
            </button>
            <button
              type="button"
              onClick={() => {
                const url = window.location.href;
                if (navigator.share) void navigator.share({ title: product.name, url });
                else void navigator.clipboard?.writeText(url);
              }}
              className="rounded-md border border-gray-300 px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Share
            </button>
            {product.type !== 'SHOWCASE' && (
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={addToCart.isPending || (product.type === 'READY_MADE' && !selectedVariant) || (product.type === 'CUSTOMIZE' && (!selectedFiber || (product.colors.length > 0 && !selectedColorId))) || fabricUnavailable}
                className="rounded-md bg-pink-600 px-6 py-3 text-sm font-medium text-white hover:bg-pink-700 disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                {addToCart.isPending ? 'Adding…' : 'Add to cart'}
              </button>
            )}
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
          {addToCart.isSuccess && <p className="mt-3 text-sm text-green-700">Added to your cart.</p>}
          {addToCart.isError && <p className="mt-3 text-sm text-red-700">Could not add this item. Please check the selected option.</p>}
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