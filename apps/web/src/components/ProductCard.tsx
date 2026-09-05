import { Link } from 'react-router-dom';
import { ProductCard as ProductCardType } from '../api/types';
import { formatPrice } from '../lib/format';
import { WishlistProduct, useWishlist } from '../hooks/useWishlist';

const AVAILABILITY_LABEL: Record<ProductCardType['availability'], string> = {
  in_stock: 'In Stock',
  out_of_stock: 'Out of Stock',
  upcoming: 'Upcoming',
  showcase: 'Showcase',
};

const AVAILABILITY_STYLE: Record<ProductCardType['availability'], string> = {
  in_stock: 'bg-green-100 text-green-700',
  out_of_stock: 'bg-red-100 text-red-700',
  upcoming: 'bg-amber-100 text-amber-700',
  showcase: 'bg-gray-100 text-gray-600',
};

function ProductCard({ product }: { product: ProductCardType | WishlistProduct }) {
  const wishlist = useWishlist();
  const totalStock = 'totalStock' in product ? product.totalStock : 0;
  const hasDiscount =
    product.compareAtPrice != null &&
    product.compareAtPrice > product.basePrice;
  const compareAt = product.compareAtPrice;

  return (
    <article className="group relative block overflow-hidden rounded-2xl border border-rose-100 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-rose-200/50">
      <Link to={`/products/${product.slug}`}>
        <div className="relative aspect-[4/5] overflow-hidden bg-rose-50">
        {product.images.length > 0 ? (
          <img
            src={product.images[0]}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-gray-400">
            No image
          </div>
        )}
        </div>
      </Link>
      {hasDiscount && <span className="absolute left-3 top-3 rounded-full bg-[#4a152d] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">Special price</span>}
      <button
        type="button"
        aria-label={wishlist.isSaved(product.id) ? 'Remove from wishlist' : 'Add to wishlist'}
        onClick={() => wishlist.toggle(product)}
        className={`absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-2xl shadow-sm ring-1 ring-black/5 transition hover:scale-110 ${wishlist.isSaved(product.id) ? 'text-pink-600' : 'text-gray-700'}`}
      >
        {wishlist.isSaved(product.id) ? '♥' : '♡'}
      </button>
      <Link to={`/products/${product.slug}`} className="block p-4">
        {product.designId && (
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-pink-600">{product.designId}</p>
        )}
        <h3 className="mt-1 min-h-10 text-sm font-semibold leading-5 text-gray-900 line-clamp-2">
          {product.name}
        </h3>
        <div className="mt-2 flex items-center gap-2">
            <span className="text-base font-bold text-[#4a152d]">
            {formatPrice(product.basePrice)}
          </span>
          {hasDiscount && (
            <span className="text-sm text-gray-400 line-through">
              {formatPrice(compareAt as number)}
            </span>
          )}
        </div>
        <span
          className={`mt-3 inline-block rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${AVAILABILITY_STYLE[product.availability]}`}
        >
          {AVAILABILITY_LABEL[product.availability]}
        </span>
        {product.availability === 'in_stock' && totalStock > 0 && totalStock <= 3 && (
          <p className="mt-2 text-xs font-semibold text-orange-700">Only {totalStock} left</p>
        )}
      </Link>
    </article>
  );
}

export default ProductCard;
