import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/lib/prisma.js', () => ({
  prisma: {
    cart: { findUnique: vi.fn(), update: vi.fn() },
    order: { create: vi.fn(), findMany: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
    productVariant: { findUnique: vi.fn(), update: vi.fn() },
    fiberInventory: { findUnique: vi.fn(), update: vi.fn() },
    stockMovement: { create: vi.fn() },
    coupon: { findUnique: vi.fn(), update: vi.fn() },
    notification: { create: vi.fn() },
    adminUser: { findMany: vi.fn() },
    measurementField: { findMany: vi.fn() },
  },
}));

import { prisma } from '../src/lib/prisma.js';
import * as ordersService from '../src/orders/orders.service.js';

const customer = { name: 'Asha', mobile: '9876543210', email: '', address: 'Main road', city: 'Pune', state: 'Maharashtra', pincode: '411001', paymentMethod: 'COD' as const };

beforeEach(() => {
  vi.clearAllMocks();
  prisma.cart.update.mockResolvedValue({});
  prisma.productVariant.findUnique.mockResolvedValue({ isActive: true, stock: 5 });
  prisma.productVariant.update.mockResolvedValue({});
  prisma.fiberInventory.findUnique.mockResolvedValue({ id: 'fi-1', stock: 5 });
  prisma.fiberInventory.update.mockResolvedValue({ id: 'fi-1', stock: 4 });
  prisma.stockMovement.create.mockResolvedValue({});
  prisma.coupon.findUnique.mockResolvedValue(null);
  prisma.coupon.update.mockResolvedValue({});
  prisma.notification.create.mockResolvedValue({});
  prisma.adminUser.findMany.mockResolvedValue([]);
  prisma.measurementField.findMany.mockResolvedValue([{ id: 'mf-bust', key: 'bust' }]);
  prisma.order.create.mockImplementation(async ({ data }) => ({ id: 'o1', ...data }));
  prisma.order.update.mockImplementation(async ({ data }) => ({ id: 'o1', status: data.status }));
});

describe('order service', () => {
  it('rejects custom items without completed measurements', async () => {
    prisma.cart.findUnique.mockResolvedValue({ id: 'c1', items: [{ productType: 'CUSTOMIZE', measurementStatus: 'PENDING', quantity: 1, unitPrice: 1500, productName: 'Custom blouse' }], totalPrice: 1500 });
    await expect(ordersService.createOrder('guest-1', customer)).rejects.toMatchObject({ statusCode: 400 });
  });

  it('creates a snapshot, decrements stock, and clears the cart', async () => {
    prisma.cart.findUnique.mockResolvedValue({ id: 'c1', items: [{ productType: 'READY_MADE', productId: 'p1', productName: 'Blouse', productDesignId: 'GS-1', variantId: 'v1', color: 'Red', size: 'M', fiberName: null, embroideryName: null, quantity: 2, unitPrice: 1200, discount: null, measurementStatus: null }], totalPrice: 2400 });
    const result = await ordersService.createOrder('guest-1', customer);
    expect(result.orderNumber).toMatch(/^GS-/);
    expect(prisma.productVariant.update).toHaveBeenCalledWith(expect.objectContaining({ data: { stock: { decrement: 2 } } }));
    expect(prisma.cart.update).toHaveBeenCalledWith(expect.objectContaining({ data: { items: [], totalItems: 0, totalPrice: 0 } }));
  });

  it('snapshots completed custom measurements with an instruction version', async () => {
    prisma.cart.findUnique.mockResolvedValue({
      id: 'c1',
      items: [{
        productType: 'CUSTOMIZE', productId: 'p1', productName: 'Custom blouse',
        productDesignId: 'GS-2', variantId: null, fiberName: 'Silk', embroideryName: null,
        quantity: 1, unitPrice: 1500, discount: null, measurementStatus: 'COMPLETE',
        measurementValues: [{ fieldKey: 'bust', label: 'Bust', value: 34, unit: 'INCHES' }],
      }],
      totalPrice: 1500,
    });
    await ordersService.createOrder('guest-1', customer);
    expect(prisma.order.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        items: [expect.objectContaining({
          measurementSnapshot: expect.objectContaining({
            measurementInstructionVersion: 1,
            values: [expect.objectContaining({
              fieldId: 'mf-bust', fieldKey: 'bust', label: 'Bust', value: 34, unit: 'INCHES',
            })],
          }),
        })],
      }),
    }));
  });

  it('allows only the next lifecycle status or cancellation', async () => {
    prisma.order.findUnique.mockResolvedValue({ id: 'o1', status: 'PLACED' });
    await expect(ordersService.adminUpdateStatus('o1', 'CONFIRMED')).resolves.toMatchObject({ status: 'CONFIRMED' });
    await expect(ordersService.adminUpdateStatus('o1', 'DELIVERED')).rejects.toMatchObject({ statusCode: 409 });
  });
});
