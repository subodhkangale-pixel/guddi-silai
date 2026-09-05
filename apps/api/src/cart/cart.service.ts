import { CartItem, ProductType } from '@prisma/client';

import { prisma } from '../lib/prisma.js';
import { fetchActiveOffers } from '../lib/activeOffers.js';
import { AppError } from '../middleware/errorHandler.js';
import { CartItemInput, UpdateCartItemInput, UpdateStyleOptionsInput } from './cart.schemas.js';
import { MeasurementInput } from './measurement.schemas.js';

function sectionTotals(items: CartItem[]) {
  const ready = items.filter((item) => item.productType === 'READY_MADE');
  const custom = items.filter((item) => item.productType === 'CUSTOMIZE');
  const sum = (list: CartItem[]) =>
    Number(list.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0).toFixed(2));
  return {
    readyMade: { count: ready.length, quantity: sumItems(ready), subtotal: sum(ready) },
    customize: { count: custom.length, quantity: sumItems(custom), subtotal: sum(custom) },
  };
}

function sumItems(items: CartItem[]) {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

function totals(items: CartItem[]) {
  return {
    totalItems: items.reduce((sum, item) => sum + item.quantity, 0),
    totalPrice: Number(
      items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0).toFixed(2)
    ),
  };
}

function cartSubtotal(items: { unitPrice: number; quantity: number }[]) {
  return Number(items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0).toFixed(2));
}

function activeOffers() {
  return fetchActiveOffers();
}

async function productCategories(productIds: string[]) {
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, categoryId: true },
  });
  return products.map((product) => product.categoryId);
}

export async function computeOfferDiscount(items: {
  unitPrice: number;
  quantity: number;
  productId: string;
}[]): Promise<number> {
  const subtotal = cartSubtotal(items);
  const productIds = items.map((item) => item.productId).filter(Boolean);
  if (productIds.length === 0) return 0;

  const [categories, offers] = await Promise.all([productCategories(productIds), activeOffers()]);

  let discount = 0;
  for (const offer of offers) {
    let applies = false;
    if (offer.applicableProductIds.length > 0 && productIds.some((id) => offer.applicableProductIds.includes(id))) applies = true;
    if (offer.applicableCategoryIds.length > 0 && categories.some((categoryId) => offer.applicableCategoryIds.includes(categoryId))) applies = true;
    if (offer.applicableProductIds.length === 0 && offer.applicableCategoryIds.length === 0) applies = true;
    if (!applies) continue;
    const value = offer.type === 'PERCENT' ? subtotal * offer.value / 100 : offer.value;
    discount += value;
  }
  return Number(Math.min(discount, subtotal).toFixed(2));
}

export function buildSections(items: CartItem[]) {
  const sections = sectionTotals(items);
  return {
    readyMade: sections.readyMade,
    customize: sections.customize,
    measurementPending: items.some(
      (item) => item.productType === 'CUSTOMIZE' && item.measurementStatus !== 'COMPLETE'
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
  const cart = await getOrCreateCart(ownerKey, ownerKey);
  return { ...cart, sections: buildSections(cart.items) };
}

async function persistWithOffers(cartId: string, items: CartItem[], extra: Record<string, unknown> = {}) {
  const summary = totals(items);
  const offerDiscount = await computeOfferDiscount(items);
  const discount = offerDiscount;
  return prisma.cart.update({
    where: { id: cartId },
    data: {
      items,
      ...summary,
      ...extra,
      couponCode: null,
      discount,
      offerDiscount,
      totalPrice: Number((summary.totalPrice - discount).toFixed(2)),
    },
  });
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

  let embroideryName: string | undefined;
  let embroiderySurcharge: number | undefined;
  if (input.embroideryId) {
    const embroidery = product.embroideryOptions.find(
      (option) => option.id === input.embroideryId && option.isActive !== false
    );
    if (!embroidery) throw new AppError(400, 'Selected embroidery is unavailable');
    embroideryName = embroidery.name;
    embroiderySurcharge = embroidery.surcharge ?? 0;
    unitPrice += embroiderySurcharge;
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
      embroideryName: embroideryName ?? null,
      embroiderySurcharge: embroiderySurcharge ?? null,
      unitPrice,
      discount: product.discountPercent ?? null,
      quantity: input.quantity,
      measurementStatus: input.productType === 'CUSTOMIZE' ? 'PENDING' : null,
      measurementValues: null,
      styleOptions: input.styleOptions ?? null,
    });
  }

  return persistWithOffers(cart.id, items, { userId: userId ?? cart.userId });
}

export async function updateItem(ownerKey: string, index: number, input: UpdateCartItemInput) {
  const cart = await prisma.cart.findUnique({ where: { ownerKey } });
  if (!cart || !cart.items[index]) throw new AppError(404, 'Cart item not found');
  const items = [...cart.items];
  if (input.quantity === 0) items.splice(index, 1);
  else items[index] = { ...items[index], quantity: input.quantity };
  return persistWithOffers(cart.id, items);
}

export async function updateStyleOptions(
  ownerKey: string,
  index: number,
  input: UpdateStyleOptionsInput
) {
  const cart = await prisma.cart.findUnique({ where: { ownerKey } });
  if (!cart || !cart.items[index]) throw new AppError(404, 'Cart item not found');
  const items = [...cart.items];
  items[index] = { ...items[index], styleOptions: input.styleOptions };
  return persistWithOffers(cart.id, items);
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
  const fields = await prisma.measurementField.findMany({
    where: { isActive: true },
    select: { id: true, key: true, label: true, isRequired: true },
  });
  const fieldByKey = new Map(fields.map((field) => [field.key, field]));
  const required = fields.filter((field) => field.isRequired).map((field) => field.key);
  const provided = new Set(input.values.map((value) => value.fieldKey));
  if (input.values.length === 0) throw new AppError(400, 'Provide at least one measurement');
  if (provided.size !== input.values.length) throw new AppError(400, 'Each measurement can only be provided once');
  const unknown = input.values.map((value) => value.fieldKey).filter((key) => !fieldByKey.has(key));
  if (unknown.length > 0) throw new AppError(400, 'One or more measurements are not valid');
  const missing = required.filter((key) => !provided.has(key));
  if (missing.length > 0) throw new AppError(400, `Missing required measurements: ${missing.join(', ')}`);

  const snapshot = input.values.map((value) => {
    const field = fieldByKey.get(value.fieldKey)!;
    return {
      fieldId: field.id,
      fieldKey: value.fieldKey,
      label: field.label,
      value: value.value,
      unit: value.unit,
    };
  });

  const items = [...cart.items];
  items[index] = {
    ...items[index],
    measurementStatus: 'COMPLETE',
    measurementValues: snapshot,
  };
  return persistWithOffers(cart.id, items);
}

export async function clearCart(ownerKey: string) {
  const cart = await prisma.cart.findUnique({ where: { ownerKey } });
  if (!cart) return getCart(ownerKey);
  return persistWithOffers(cart.id, []);
}
