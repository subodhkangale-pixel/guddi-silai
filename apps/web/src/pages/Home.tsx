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
    <div className="max-w-7xl mx-auto px-4 py-6 pb-24 sm:px-6 sm:py-10 lg:px-8">
      <section className="relative mb-10 overflow-hidden rounded-[2rem] bg-[#4a152d] px-6 py-10 text-white shadow-xl shadow-rose-200/60 sm:px-12 sm:py-16">
        <div className="absolute -right-24 -top-28 h-80 w-80 rounded-full bg-pink-400/30 blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 h-80 w-80 rounded-full bg-amber-300/20 blur-3xl" />
        <div className="relative max-w-2xl animate-float-in">
          <p className="inline-flex rounded-full border border-rose-200/40 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-rose-100">Blouses made memorable</p>
          <h1 className="mt-5 font-serif text-4xl font-bold leading-tight sm:text-6xl">Your style, stitched with love.</h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-rose-100 sm:text-lg">Discover ready-to-wear designs or create a blouse that feels completely yours—from fabric and colour to the smallest finishing touch.</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a href="/products" className="rounded-full bg-white px-6 py-3 text-sm font-bold text-[#4a152d] shadow-lg transition hover:-translate-y-0.5 hover:bg-rose-50">Shop the collection</a>
            <a href="/products?type=CUSTOMIZE" className="rounded-full border border-white/50 px-6 py-3 text-sm font-bold text-white transition hover:bg-white/10">Customize a blouse</a>
          </div>
        </div>
        <div className="relative mt-10 grid max-w-xl grid-cols-3 gap-3 text-center text-xs sm:text-sm">
          <div className="rounded-2xl bg-white/10 px-2 py-3 backdrop-blur"><strong className="block text-lg">01</strong>Choose design</div>
          <div className="rounded-2xl bg-white/10 px-2 py-3 backdrop-blur"><strong className="block text-lg">02</strong>Make it yours</div>
          <div className="rounded-2xl bg-white/10 px-2 py-3 backdrop-blur"><strong className="block text-lg">03</strong>Wear with joy</div>
        </div>
      </section>
      <section className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-pink-600">New arrivals</p>
          <h2 className="mt-1 font-serif text-3xl font-bold text-[#4a152d] sm:text-4xl">Find your next favourite</h2>
          <p className="mt-2 max-w-2xl text-gray-600">
            Ready-made styles, custom designs, and new work from our collection.
          </p>
        </div>
        <a href="/products" className="text-sm font-semibold text-gray-900 hover:text-pink-600">
          Browse all designs →
        </a>
      </section>

      <section className="mb-12">
        <div className="flex items-baseline justify-between">
          <h3 className="font-serif text-2xl font-bold text-[#4a152d]">Shop by occasion</h3>
          <a href="/products" className="text-sm font-semibold text-pink-600">View all →</a>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {OCCASIONS.map((occasion) => (
            <a
              key={occasion.value}
              href={`/products?occasion=${occasion.value}`}
              className="group rounded-2xl border border-rose-100 bg-gradient-to-br from-white via-rose-50 to-amber-50 p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-pink-200 hover:shadow-lg"
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
