import { useEffect, useState } from 'react';

import { ProductCard } from '../api/types';

const STORAGE_KEY = 'guddi-silai-wishlist';

export type WishlistProduct = Pick<ProductCard, 'id' | 'slug' | 'name' | 'designId' | 'basePrice' | 'compareAtPrice' | 'images' | 'availability'>;

function readWishlist(): WishlistProduct[] {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return saved ? (JSON.parse(saved) as WishlistProduct[]) : [];
  } catch {
    return [];
  }
}

function saveWishlist(items: WishlistProduct[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event('wishlist-updated'));
}

export function useWishlist() {
  const [items, setItems] = useState<WishlistProduct[]>(readWishlist);

  useEffect(() => {
    const sync = () => setItems(readWishlist());
    window.addEventListener('wishlist-updated', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('wishlist-updated', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  function toggle(product: WishlistProduct) {
    const next = items.some((item) => item.id === product.id)
      ? items.filter((item) => item.id !== product.id)
      : [...items, product];
    setItems(next);
    saveWishlist(next);
  }

  function remove(id: string) {
    const next = items.filter((item) => item.id !== id);
    setItems(next);
    saveWishlist(next);
  }

  return { items, isSaved: (id: string) => items.some((item) => item.id === id), toggle, remove };
}
