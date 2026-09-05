import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/lib/prisma.js', () => ({
  prisma: {
    cart: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
    product: { findUnique: vi.fn() },
    productVariant: { findUnique: vi.fn() },
    color: { findUnique: vi.fn() },
    size: { findUnique: vi.fn() },
  },
}));

import { prisma } from '../src/lib/prisma.js';
import * as cartService from '../src/cart/cart.service.js';

const product = {
  id: 'p1',
  name: 'Silk Blouse',
  designId: 'GS-1',
  type: 'READY_MADE',
  basePrice: 1200,
  discountPercent: 10,
  images: ['image.webp'],
  isActive: true,
  fiberOptions: [{ id: 'f1', name: 'Silk', price: 300, isActive: true }],
};

const cart = {
  id: 'cart-1',
  ownerKey: 'guest-1',
  userId: null,
  items: [],
  totalItems: 0,
  totalPrice: 0,
};

beforeEach(() => {
  vi.clearAllMocks();
  prisma.cart.findUnique.mockResolvedValue(cart);
  prisma.product.findUnique.mockResolvedValue(product);
  prisma.color.findUnique.mockResolvedValue({ name: 'Red' });
  prisma.size.findUnique.mockResolvedValue({ name: 'M' });
  prisma.cart.update.mockImplementation(async ({ data }) => ({ ...cart, ...data }));
});

describe('cart service', () => {
  it('uses the selected ready-made variant price and quantity', async () => {
    prisma.productVariant.findUnique.mockResolvedValue({
      id: 'v1', productId: 'p1', colorId: 'c1', sizeId: 's1', price: 1500, stock: 4, isActive: true,
    });

    const result = await cartService.addItem('guest-1', undefined, {
      productId: 'p1', productType: 'READY_MADE', variantId: 'v1', quantity: 2,
    });

    expect(result.totalItems).toBe(2);
    expect(result.totalPrice).toBe(3000);
    expect(result.items[0]).toMatchObject({ variantId: 'v1', color: 'Red', size: 'M', unitPrice: 1500 });
  });

  it('adds the selected fiber price to a custom product', async () => {
    prisma.product.findUnique.mockResolvedValue({
      ...product,
      type: 'CUSTOMIZE',
    });

    const result = await cartService.addItem('guest-1', undefined, {
      productId: 'p1', productType: 'CUSTOMIZE', fiberId: 'f1', quantity: 1,
    });

    expect(result.totalPrice).toBe(1500);
    expect(result.items[0]).toMatchObject({ fiberId: 'f1', fiberName: 'Silk', unitPrice: 1500, measurementStatus: 'PENDING' });
  });

  it('rejects quantities above available stock', async () => {
    prisma.productVariant.findUnique.mockResolvedValue({
      id: 'v1', productId: 'p1', colorId: 'c1', sizeId: 's1', price: 1500, stock: 1, isActive: true,
    });

    await expect(cartService.addItem('guest-1', undefined, {
      productId: 'p1', productType: 'READY_MADE', variantId: 'v1', quantity: 2,
    })).rejects.toMatchObject({ statusCode: 409 });
  });

  it('marks custom cart measurements complete and stores the values', async () => {
    const customCart = {
      ...cart,
      items: [{
        productType: 'CUSTOMIZE', productId: 'p1', productName: 'Custom blouse',
        measurementStatus: 'PENDING', measurementValues: null, quantity: 1,
        unitPrice: 1500,
      }],
    };
    prisma.cart.findUnique.mockResolvedValue(customCart);
    const result = await cartService.updateMeasurements('guest-1', 0, {
      values: [{ fieldKey: 'bust', label: 'Bust', value: 34, unit: 'INCHES' }],
    });
    expect(result.items[0]).toMatchObject({ measurementStatus: 'COMPLETE' });
    expect(result.items[0].measurementValues).toEqual([
      { fieldKey: 'bust', label: 'Bust', value: 34, unit: 'INCHES' },
    ]);
  });
});
