import { useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { SORT_OPTIONS } from '@guddi-silai/shared';

import ProductCard from '../components/ProductCard';
import Spinner from '../components/Spinner';
import {
  useCategories,
  useColors,
  useEmbroideries,
  useFibers,
  useProducts,
} from '../api/hooks';
import { PRICE_RANGES, ProductQuery } from '../api/types';

const SORT_LABELS: Record<(typeof SORT_OPTIONS)[number], string> = {
  newest: 'Newest First',
  price_low_to_high: 'Price: Low to High',
  price_high_to_low: 'Price: High to Low',
  most_popular: 'Most Popular',
  most_liked: 'Most Liked',
  most_viewed: 'Most Viewed',
  best_rated: 'Best Rated',
};

const OCCASIONS = [
  { value: 'bridal', label: 'Bridal' },
  { value: 'festive', label: 'Festive' },
  { value: 'party', label: 'Party' },
  { value: 'daily', label: 'Daily wear' },
] as const;

const AVAILABILITY_OPTIONS = [
  { value: 'in_stock', label: 'In Stock' },
  { value: 'out_of_stock', label: 'Out of Stock' },
  { value: 'upcoming', label: 'Upcoming' },
] as const;

function Catalog() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search.trim());

  const [filters, setFilters] = useState<ProductQuery>({ sort: 'newest' });
  const [selectedPrice, setSelectedPrice] = useState(0);
  const [sentinel, setSentinel] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    const occasion = searchParams.get('occasion');
    if (occasion && OCCASIONS.some((option) => option.value === occasion)) {
      setFilters((f) => (f.occasion === occasion ? f : { ...f, occasion }));
    }
  }, [searchParams]);

  function setOccasion(occasion?: string) {
    setFilters((f) => ({ ...f, occasion: occasion || undefined }));
    const next = new URLSearchParams(searchParams);
    if (occasion) next.set('occasion', occasion);
    else next.delete('occasion');
    setSearchParams(next, { replace: true });
  }

  const categories = useCategories();
  const colors = useColors();
  const fibers = useFibers();
  const embroideries = useEmbroideries();

  const params = useMemo<ProductQuery>(
    () => ({
      ...filters,
      q: deferredSearch || undefined,
      minPrice: PRICE_RANGES[selectedPrice]?.min,
      maxPrice: PRICE_RANGES[selectedPrice]?.max,
    }),
    [filters, deferredSearch, selectedPrice]
  );

  const products = useProducts(params);

  const pages = products.data?.pages ?? [];
  const items = pages.flatMap((page) => page.data);
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

  function setCategory(categoryId: string) {
    setFilters((f) => ({ ...f, categoryId: categoryId || undefined, subCategoryId: undefined }));
  }

  function toggleCheckbox(key: 'colorId' | 'fiberId', id: string) {
    setFilters((f) => {
      const next = { ...f } as ProductQuery;
      if ((next[key] as string | undefined) === id) {
        delete next[key];
      } else {
        next[key] = id;
      }
      return next;
    });
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Blouse Collection</h1>
        <p className="mt-1 text-gray-600">
          Ready-made, customizable, and showcase blouses — search by name, design ID, or fabric.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-8">
        {/* Filters */}
        <aside className="space-y-6">
          <div>
            <label className="text-sm font-medium text-gray-700">Search</label>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="e.g. silk, GS-206, bridal"
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
            />
          </div>

          <div>
            <span className="text-sm font-medium text-gray-700">Category</span>
            <select
              value={filters.categoryId ?? ''}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
            >
              <option value="">All Categories</option>
              {(categories.data ?? []).map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <span className="text-sm font-medium text-gray-700">Occasion</span>
            <div className="mt-1 space-y-1">
              {OCCASIONS.map((option) => (
                <label key={option.value} className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={filters.occasion === option.value}
                    onChange={() => setOccasion(filters.occasion === option.value ? undefined : option.value)}
                    className="rounded border-gray-300 text-purple-600"
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </div>

          <div>
            <span className="text-sm font-medium text-gray-700">Price</span>
            <select
              value={selectedPrice}
              onChange={(e) => setSelectedPrice(Number(e.target.value))}
              className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
            >
              {PRICE_RANGES.map((range, index) => (
                <option key={range.label} value={index}>
                  {range.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <span className="text-sm font-medium text-gray-700">Availability</span>
            <select
              value={filters.availability ?? ''}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  availability: (e.target.value as ProductQuery['availability']) || undefined,
                }))
              }
              className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
            >
              <option value="">All</option>
              {AVAILABILITY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <CheckboxGroup
            label="Color"
            options={(colors.data?.data ?? []).map((c) => ({ id: c.id, name: c.name }))}
            selected={filters.colorId}
            onToggle={(id) => toggleCheckbox('colorId', id)}
          />
          <CheckboxGroup
            label="Fabric / Fiber"
            options={(fibers.data?.data ?? []).map((f) => ({ id: f.id, name: f.name }))}
            selected={filters.fiberId}
            onToggle={(id) => toggleCheckbox('fiberId', id)}
          />
          {(embroideries.data?.data ?? []).length > 0 && (
            <div>
              <span className="text-sm font-medium text-gray-700">Embroidery</span>
              <div className="mt-1 space-y-1">
                {(embroideries.data?.data ?? []).map((record) => (
                  <label key={record.id} className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={filters.embroideryId === record.id}
                      onChange={() =>
                        setFilters((f) => {
                          const next = { ...f } as ProductQuery;
                          if (next.embroideryId === record.id) delete next.embroideryId;
                          else next.embroideryId = record.id;
                          return next;
                        })
                      }
                      className="rounded border-gray-300 text-purple-600"
                    />
                    {record.name}
                  </label>
                ))}
              </div>
            </div>
          )}
        </aside>

        {/* Product feed */}
        <section>
          <div className="flex items-center justify-between gap-4 mb-4">
            <p className="text-sm text-gray-600">
              {products.isLoading ? 'Loading…' : `${items.length} blouses`}
            </p>
            <select
              value={filters.sort}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  sort: e.target.value as ProductQuery['sort'],
                }))
              }
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {SORT_LABELS[option]}
                </option>
              ))}
            </select>
          </div>

          {products.isPending ? (
            <Spinner label="Fetching blouses…" />
          ) : products.isError ? (
            <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
              Could not load products. Make sure the API is running on port 4000.
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-md bg-gray-50 p-8 text-center text-gray-500">
              No blouses match your filters yet. Try adjusting or clearing the filters.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                {items.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
              <div ref={setSentinel} className="flex items-center justify-center py-6">
                {products.isFetchingNextPage ? (
                  <Spinner label="Loading more…" />
                ) : hasMore ? null : (
                  <p className="text-sm text-gray-400">You've reached the end ✨</p>
                )}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

function CheckboxGroup(props: {
  label: string;
  options: Array<{ id: string; name: string }>;
  selected?: string;
  onToggle(id: string): void;
}) {
  if (props.options.length === 0) return null;
  return (
    <div>
      <span className="text-sm font-medium text-gray-700">{props.label}</span>
      <div className="mt-1 space-y-1">
        {props.options.map((option) => (
          <label key={option.id} className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={props.selected === option.id}
              onChange={() => props.onToggle(option.id)}
              className="rounded border-gray-300 text-purple-600"
            />
            {option.name}
          </label>
        ))}
      </div>
    </div>
  );
}

export default Catalog;