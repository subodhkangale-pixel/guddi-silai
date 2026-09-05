import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { FiberInventoryInput, StockAdjustmentInput } from './inventory.schemas.js';

export async function listFiberInventory(lowStockBelow = 5) {
  return prisma.fiberInventory.findMany({
    where: { stock: { lte: lowStockBelow } },
    orderBy: { stock: 'asc' },
  });
}

export async function upsertFiberInventory(input: FiberInventoryInput) {
  const [fiber, color] = await Promise.all([
    prisma.fiber.findUnique({ where: { id: input.fiberId } }),
    prisma.color.findUnique({ where: { id: input.colorId } }),
  ]);
  if (!fiber || !color) throw new AppError(404, 'Fiber or color not found');

  const current = await prisma.fiberInventory.findUnique({
    where: { fiberId_colorId: { fiberId: input.fiberId, colorId: input.colorId } },
  });
  const inventory = await prisma.fiberInventory.upsert({
    where: { fiberId_colorId: { fiberId: input.fiberId, colorId: input.colorId } },
    create: input,
    update: { stock: input.stock },
  });
  const delta = input.stock - (current?.stock ?? 0);
  if (delta !== 0) {
    await prisma.stockMovement.create({
      data: { fiberInventoryId: inventory.id, type: delta > 0 ? 'ADJUSTMENT_IN' : 'ADJUSTMENT_OUT', quantity: delta, reason: 'Admin stock update' },
    });
  }
  return inventory;
}

export async function adjustVariantStock(variantId: string, input: StockAdjustmentInput) {
  const variant = await prisma.productVariant.findUnique({ where: { id: variantId } });
  if (!variant) throw new AppError(404, 'Variant not found');
  const nextStock = variant.stock + input.quantity;
  if (nextStock < 0) throw new AppError(409, 'Stock cannot become negative');
  const updated = await prisma.productVariant.update({ where: { id: variantId }, data: { stock: nextStock } });
  await prisma.stockMovement.create({
    data: { variantId, type: input.quantity > 0 ? 'ADJUSTMENT_IN' : 'ADJUSTMENT_OUT', quantity: input.quantity, reason: input.reason ?? 'Admin stock adjustment' },
  });
  return updated;
}
