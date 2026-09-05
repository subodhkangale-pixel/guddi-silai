import { Link } from 'react-router-dom';

import ProductCard from '../components/ProductCard';
import { useWishlist } from '../hooks/useWishlist';

function WishlistPage() {
  const wishlist = useWishlist();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="border-b border-gray-200 pb-5">
        <p className="text-sm font-semibold uppercase tracking-wide text-pink-600">Saved designs</p>
        <h1 className="mt-1 text-3xl font-bold text-gray-900">Wishlist</h1>
      </div>
      {wishlist.items.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-lg text-gray-700">You have not saved any designs yet.</p>
          <Link to="/products" className="mt-4 inline-block font-semibold text-pink-600">Explore designs →</Link>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {wishlist.items.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}

export default WishlistPage;
