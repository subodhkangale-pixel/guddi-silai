import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useAddCartItem } from '../api/hooks';
import { formatPrice } from '../lib/format';
import Spinner from '../components/Spinner';
import { useWishlist, WishlistProduct } from '../hooks/useWishlist';

function WishlistCard({ product }: { product: WishlistProduct }) {
  const wishlist = useWishlist();
  const addToCart = useAddCartItem();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string>();

  async function moveToCart() {
    setBusy(true);
    setMessage(undefined);
    try {
      if (product.availability !== 'in_stock') {
        navigate(`/products/${product.slug}`);
        return;
      }
      const result = await import('../api/catalogApi').then((m) => m.getProductBySlug(product.slug));
      const detail = result.data;
      if (detail.type === 'READY_MADE') {
        const variant = detail.variants.find((v) => v.stock > 0);
        if (!variant) {
          setMessage('This design is out of stock.');
          return;
        }
        addToCart.mutate(
          { productId: detail.id, productType: 'READY_MADE', variantId: variant.id },
          {
            onSuccess: () => {
              wishlist.remove(product.id);
              setMessage('Moved to cart.');
            },
            onError: () => setMessage('Could not add to cart.'),
          }
        );
      } else {
        navigate(`/products/${product.slug}`);
      }
    } catch {
      navigate(`/products/${product.slug}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="group overflow-hidden rounded-lg border border-gray-200 bg-white transition-shadow hover:shadow-md">
      <Link to={`/products/${product.slug}`} className="block">
        <div className="aspect-[4/5] overflow-hidden bg-gray-100">
          {product.images.length > 0 ? (
            <img
              src={product.images[0]}
              alt={product.name}
              loading="lazy"
              className="h-full w-full object-cover group-hover:scale-105 transition-transform"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-gray-400">No image</div>
          )}
        </div>
      </Link>
      <div className="p-4">
        {product.designId && <p className="text-xs font-medium text-purple-600">{product.designId}</p>}
        <Link to={`/products/${product.slug}`}>
          <h3 className="mt-1 text-sm font-medium text-gray-900 line-clamp-2">{product.name}</h3>
        </Link>
        <p className="mt-2 text-base font-semibold text-gray-900">{formatPrice(product.basePrice)}</p>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={moveToCart}
            disabled={busy || addToCart.isPending}
            className="flex-1 rounded-md bg-purple-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-purple-700 disabled:opacity-50"
          >
            {busy ? 'Adding…' : 'Move to cart'}
          </button>
          <button
            type="button"
            onClick={() => wishlist.remove(product.id)}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            Remove
          </button>
        </div>
        {message && <p className="mt-2 text-xs text-green-700">{message}</p>}
      </div>
    </article>
  );
}

function WishlistPage() {
  const wishlist = useWishlist();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="border-b border-gray-200 pb-5">
        <p className="text-sm font-semibold uppercase tracking-wide text-pink-600">Saved designs</p>
        <h1 className="mt-1 text-3xl font-bold text-gray-900">Wishlist</h1>
      </div>
      {!wishlist.ready ? (
        <div className="py-20">
          <Spinner label="Loading your wishlist…" />
        </div>
      ) : wishlist.items.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-lg text-gray-700">You have not saved any designs yet.</p>
          <Link to="/products" className="mt-4 inline-block font-semibold text-pink-600">Explore designs →</Link>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {wishlist.items.map((product) => (
            <WishlistCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}

export default WishlistPage;