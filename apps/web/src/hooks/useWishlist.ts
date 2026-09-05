import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '../auth/AuthContext';
import { ProductCard } from '../api/types';
import { addWishlistItem, getWishlist, removeWishlistItem, WishlistItem } from '../api/wishlistApi';

const STORAGE_KEY = 'guddi-silai-wishlist';

export type WishlistProduct = Pick<ProductCard, 'id' | 'slug' | 'name' | 'designId' | 'basePrice' | 'compareAtPrice' | 'images' | 'availability'>;

function readLocalWishlist(): WishlistProduct[] {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return saved ? (JSON.parse(saved) as WishlistProduct[]) : [];
  } catch {
    return [];
  }
}

function saveLocalWishlist(items: WishlistProduct[] | []) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event('wishlist-updated'));
}

function clearLocalWishlist() {
  window.localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event('wishlist-updated'));
}

function dbItemsToProducts(items: WishlistItem[]): WishlistProduct[] {
  return items.map((item) => ({
    id: item.productId,
    slug: item.slug ?? item.productId,
    name: item.productName,
    designId: item.productDesignId ?? null,
    basePrice: item.basePrice,
    compareAtPrice: null,
    images: item.productImage ? [item.productImage] : [],
    availability: 'in_stock' as const,
  }));
}

export function useWishlist() {
  const { user, status } = useAuth();
  const isAuthenticated = status === 'authenticated' && Boolean(user);
  const [items, setItems] = useState<WishlistProduct[]>([]);
  const [ready, setReady] = useState(!isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) {
      setItems(readLocalWishlist());
      setReady(true);
      return;
    }

    let cancelled = false;
    async function loadFromDb() {
      try {
        const result = await getWishlist();
        if (cancelled) return;
        const dbItems = result?.data.items ?? [];
        const local = readLocalWishlist();
        const merged = [...dbItemsToProducts(dbItems)];
        for (const localItem of local) {
          if (!merged.some((item) => item.id === localItem.id)) {
            merged.push(localItem);
            try {
              await addWishlistItem(localItem.id);
            } catch {
              // ignore; local merge is best-effort
            }
          }
        }
        setItems(merged);
        clearLocalWishlist();
      } catch {
        if (!cancelled) setItems(readLocalWishlist());
      } finally {
        if (!cancelled) setReady(true);
      }
    }
    void loadFromDb();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const sync = () => {
      if (readLocalWishlist().length === 0) setItems([]);
    };
    window.addEventListener('wishlist-updated', sync);
    return () => window.removeEventListener('wishlist-updated', sync);
  }, [isAuthenticated]);

  const toggle = useCallback(
    (product: WishlistProduct) => {
      const saved = items.some((item) => item.id === product.id);
      if (isAuthenticated) {
        const action = saved ? removeWishlistItem(product.id) : addWishlistItem(product.id);
        void action
          .then((result) => {
            if (result) setItems(dbItemsToProducts(result.data.items));
          })
          .catch(() => {
            // keep local state consistent on failure
          });
        setItems((current) =>
          saved ? current.filter((item) => item.id !== product.id) : [...current, product]
        );
      } else {
        const next = saved
          ? items.filter((item) => item.id !== product.id)
          : [...items, product];
        setItems(next);
        saveLocalWishlist(next);
      }
    },
    [isAuthenticated, items]
  );

  const remove = useCallback(
    (id: string) => {
      if (isAuthenticated) {
        void removeWishlistItem(id).catch(() => {});
        setItems((current) => current.filter((item) => item.id !== id));
      } else {
        const next = items.filter((item) => item.id !== id);
        setItems(next);
        saveLocalWishlist(next);
      }
    },
    [isAuthenticated, items]
  );

  return { items, ready, isSaved: (id: string) => items.some((item) => item.id === id), toggle, remove };
}