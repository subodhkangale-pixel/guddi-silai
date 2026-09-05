import { CartItem, ProductType } from '@prisma/client';

import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { CartItemInput, UpdateCartItemInput } from './cart.schemas.js';
import { MeasurementInput } from './measurement.schemas.js';

function totals(items: CartItem[]) {
  return {
    totalItems: items.reduce((sum, item) => sum + item.quantity, 0),
    totalPrice: Number(
      items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0).toFixed(2)
    ),
  };
}

async function getOrCreateCart(ownerKey: string, userId?: string) {
  const existing = await prisma.cart.findUnique({ where: { ownerKey } });
  if (existing) return existing;
  return prisma.cart.create({
    data: { ownerKey, userId, items: [], totalItems: 0, totalPrice: 0 },
  });
}

export async function getCart(ownerKey: string) {
  return getOrCreateCart(ownerKey, ownerKey);
}

export async function addItem(ownerKey: string, userId: string | undefined, input: CartItemInput) {
  const product = await prisma.product.findUnique({ where: { id: input.productId } });
  if (!product || !product.isActive) throw new AppError(404, 'Product not found');
  if (product.type !== input.productType) throw new AppError(400, 'Product type does not match');

  let unitPrice = product.basePrice;
  let variantId: string | undefined;
  let colorId = input.colorId;
  let sizeId = input.sizeId;
  let fiberId = input.fiberId;
  let fiberName: string | undefined;
  let fiberPrice: number | undefined;

  if (input.productType === 'READY_MADE') {
    if (!input.variantId) throw new AppError(400, 'Choose a size and color');
    const variant = await prisma.productVariant.findUnique({ where: { id: input.variantId } });
    if (!variant || !variant.isActive || variant.productId !== product.id) {
      throw new AppError(400, 'Selected variant is unavailable');
    }
    if (variant.stock < input.quantity) throw new AppError(409, 'Not enough stock available');
    unitPrice = variant.price;
    variantId = variant.id;
    colorId = variant.colorId;
    sizeId = variant.sizeId;
  } else {
    if (!input.fiberId) throw new AppError(400, 'Choose a fabric before adding to cart');
    if (!input.colorId) throw new AppError(400, 'Choose a fabric color before adding to cart');
    const fiber = product.fiberOptions.find((option) => option.id === input.fiberId && option.isActive !== false);
    if (!fiber) throw new AppError(400, 'Selected fabric is unavailable');
    const fiberInventory = await prisma.fiberInventory.findUnique({
      where: { fiberId_colorId: { fiberId: input.fiberId, colorId: input.colorId } },
    });
    if (!fiberInventory || fiberInventory.stock < input.quantity) {
      throw new AppError(409, 'Selected fabric color is out of stock');
    }
    fiberId = fiber.id;
    fiberName = fiber.name;
    fiberPrice = fiber.price ?? 0;
    unitPrice += fiberPrice;
  }

  const [cart, colors, sizes] = await Promise.all([
    getOrCreateCart(ownerKey, userId),
    colorId ? prisma.color.findUnique({ where: { id: colorId } }) : Promise.resolve(null),
    sizeId ? prisma.size.findUnique({ where: { id: sizeId } }) : Promise.resolve(null),
  ]);

  const items = [...cart.items];
  const existingIndex = items.findIndex(
    (item) =>
      item.productId === product.id &&
      item.variantId === variantId &&
      item.colorId === colorId &&
      item.sizeId === sizeId &&
      item.fiberId === fiberId &&
      item.embroideryId === input.embroideryId
  );
  if (existingIndex >= 0) {
    const nextQuantity = items[existingIndex].quantity + input.quantity;
    if (input.productType === 'READY_MADE') {
      const variant = await prisma.productVariant.findUnique({ where: { id: variantId } });
      if (!variant || variant.stock < nextQuantity) throw new AppError(409, 'Not enough stock available');
    }
    items[existingIndex] = { ...items[existingIndex], quantity: nextQuantity };
  } else {
    items.push({
      productType: product.type as ProductType,
      productId: product.id,
      productName: product.name,
      productDesignId: product.designId,
      productImage: product.images[0] ?? null,
      variantId: variantId ?? null,
      color: colors?.name ?? null,
      colorId: colorId ?? null,
      size: sizes?.name ?? null,
      sizeId: sizeId ?? null,
      fiberId: fiberId ?? null,
      fiberName: fiberName ?? null,
      fiberPrice: fiberPrice ?? null,
      embroideryId: input.embroideryId ?? null,
      embroideryName: null,
      embroiderySurcharge: null,
      unitPrice,
      discount: product.discountPercent ?? null,
      quantity: input.quantity,
      measurementStatus: input.productType === 'CUSTOMIZE' ? 'PENDING' : null,
      measurementValues: null,
    });
  }

  const summary = totals(items);
  return prisma.cart.update({
    where: { id: cart.id },
    data: { items, ...summary, userId: userId ?? cart.userId },
  });
}

export async function updateItem(ownerKey: string, index: number, input: UpdateCartItemInput) {
  const cart = await prisma.cart.findUnique({ where: { ownerKey } });
  if (!cart || !cart.items[index]) throw new AppError(404, 'Cart item not found');
  const items = [...cart.items];
  if (input.quantity === 0) items.splice(index, 1);
  else items[index] = { ...items[index], quantity: input.quantity };
  return prisma.cart.update({ where: { id: cart.id }, data: { items, ...totals(items) } });
}

export async function removeItem(ownerKey: string, index: number) {
  return updateItem(ownerKey, index, { quantity: 0 });
}

export async function updateMeasurements(ownerKey: string, index: number, input: MeasurementInput) {
  const cart = await prisma.cart.findUnique({ where: { ownerKey } });
  if (!cart || !cart.items[index]) throw new AppError(404, 'Cart item not found');
  if (cart.items[index].productType !== 'CUSTOMIZE') {
    throw new AppError(400, 'Measurements are only required for custom items');
  }
  const items = [...cart.items];
  items[index] = {
    ...items[index],
    measurementStatus: 'COMPLETE',
    measurementValues: input.values,
  };
  return prisma.cart.update({ where: { id: cart.id }, data: { items } });
}

export async function clearCart(ownerKey: string) {
  const cart = await prisma.cart.findUnique({ where: { ownerKey } });
  if (!cart) return getCart(ownerKey);
  return prisma.cart.update({ where: { id: cart.id }, data: { items: [], totalItems: 0, totalPrice: 0 } });
}
