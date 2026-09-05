import { useCallback, useEffect, useState } from 'react';

import ProductCard from '../components/ProductCard';
import Spinner from '../components/Spinner';
import { useProducts } from '../api/hooks';

const OCCASIONS = [
  { value: 'bridal', label: 'Bridal', tagline: 'Your trousseau edit' },
  { value: 'festive', label: 'Festive', tagline: 'Celebration-ready' },
  { value: 'party', label: 'Party', tagline: 'Stand out after dark' },
  { value: 'daily', label: 'Daily wear', tagline: 'Effortless every day' },
] as const;

function Home() {
  const [sentinel, setSentinel] = useState<HTMLDivElement | null>(null);
  const products = useProducts({ sort: 'newest' });
  const items = products.data?.pages.flatMap((page) => page.data) ?? [];
  const hasMore = products.hasNextPage ?? false;

  const loadMore = useCallback(() => {
    if (hasMore && !products.isFetchingNextPage) {
      void products.fetchNextPage();
    }
  }, [hasMore, products]);

  useEffect(() => {
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) loadMore();
      },
      { rootMargin: '400px' }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [sentinel, loadMore]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
      <section className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-pink-600">Guddi Silai</p>
          <h2 className="mt-1 text-3xl font-bold text-gray-900 sm:text-4xl">Find your next blouse</h2>
          <p className="mt-2 max-w-2xl text-gray-600">
            Ready-made styles, custom designs, and new work from our collection.
          </p>
        </div>
        <a href="/products" className="text-sm font-semibold text-gray-900 hover:text-pink-600">
          Browse all designs →
        </a>
      </section>

      <section className="mb-10">
        <div className="flex items-baseline justify-between">
          <h3 className="text-lg font-bold text-gray-900">Shop by occasion</h3>
          <a href="/products" className="text-sm font-semibold text-pink-600">View all →</a>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {OCCASIONS.map((occasion) => (
            <a
              key={occasion.value}
              href={`/products?occasion=${occasion.value}`}
              className="group rounded-lg border border-gray-200 bg-gradient-to-br from-pink-50 to-amber-50 p-5 transition hover:border-pink-300 hover:shadow-sm"
            >
              <p className="text-base font-bold text-gray-900 group-hover:text-pink-700">{occasion.label}</p>
              <p className="mt-1 text-sm text-gray-500">{occasion.tagline}</p>
              <p className="mt-3 text-sm font-semibold text-pink-600">Shop now →</p>
            </a>
          ))}
        </div>
      </section>

      {products.isPending ? (
        <Spinner label="Loading latest designs…" />
      ) : products.isError ? (
        <div className="rounded-lg bg-red-50 p-5 text-sm text-red-700">
          We could not load the latest designs. Please try again shortly.
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-lg bg-gray-50 p-10 text-center text-gray-500">
          New designs are being prepared. Browse the collection to explore more.
        </div>
      ) : (
        <section aria-label="Latest blouse designs">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {items.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          <div ref={setSentinel} className="flex min-h-16 items-center justify-center py-5">
            {products.isFetchingNextPage ? (
              <Spinner label="Loading more designs…" />
            ) : hasMore ? null : (
              <p className="text-sm text-gray-400">You have reached the end of the collection.</p>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

export default Home;