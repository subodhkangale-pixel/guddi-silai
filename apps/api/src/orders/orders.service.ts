import { OrderStatus, PaymentMethod, PaymentStatus } from '@prisma/client';

import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { CreateOrderInput } from './orders.schemas.js';

function orderNumber() {
  const stamp = Date.now().toString(36).toUpperCase();
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `GS-${stamp}-${suffix}`;
}

export async function createOrder(ownerKey: string, input: CreateOrderInput) {
  const cart = await prisma.cart.findUnique({ where: { ownerKey } });
  if (!cart || cart.items.length === 0) throw new AppError(400, 'Your cart is empty');

  for (const item of cart.items) {
    if (item.productType === 'CUSTOMIZE' && item.measurementStatus !== 'COMPLETE') {
      throw new AppError(400, 'Complete measurements before checkout');
    }
    if (item.variantId) {
      const variant = await prisma.productVariant.findUnique({ where: { id: item.variantId } });
      if (!variant || !variant.isActive || variant.stock < item.quantity) {
        throw new AppError(409, `${item.productName} is no longer available in that quantity`);
      }
    }
    if (item.productType === 'CUSTOMIZE' && item.fiberId && item.colorId) {
      const fiberInventory = await prisma.fiberInventory.findUnique({
        where: { fiberId_colorId: { fiberId: item.fiberId, colorId: item.colorId } },
      });
      if (!fiberInventory || fiberInventory.stock < item.quantity) {
        throw new AppError(409, `${item.productName} fabric is no longer available in that quantity`);
      }
    }
  }

  const total = Number(cart.totalPrice.toFixed(2));
  const measurementSnapshotFor = (item: (typeof cart.items)[number]) => {
    if (item.productType !== 'CUSTOMIZE' || !Array.isArray(item.measurementValues)) return null;
    return {
      values: item.measurementValues.map((value) => {
        const measurement = value as {
          fieldKey: string;
          label: string;
          value: number;
          unit: string;
        };
        return {
          fieldId: measurement.fieldKey,
          fieldKey: measurement.fieldKey,
          label: measurement.label,
          value: measurement.value,
          unit: measurement.unit,
        };
      }),
      measurementInstructionVersion: 1,
      sourceProfileId: null,
    };
  };
  const order = await prisma.order.create({
    data: {
      orderNumber: orderNumber(),
      userId: ownerKey,
      status: OrderStatus.PLACED,
      customer: {
        name: input.name,
        mobile: input.mobile,
        email: input.email || null,
        address: input.address,
        city: input.city,
        state: input.state,
        pincode: input.pincode,
      },
      items: cart.items.map((item) => ({
        productName: item.productName,
        productDesignId: item.productDesignId,
        variantId: item.variantId,
        sku: null,
        productType: item.productType,
        color: item.color,
        size: item.size,
        fiber: item.fiberName,
        embroidery: item.embroideryName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount,
        measurementSnapshot: measurementSnapshotFor(item),
        customizationNotes: null,
        total: Number((item.unitPrice * item.quantity).toFixed(2)),
      })),
      payment: {
        method: input.paymentMethod === 'RAZORPAY' ? PaymentMethod.RAZORPAY : PaymentMethod.COD,
        status: PaymentStatus.PENDING,
        transactionId: null,
        amount: total,
        paidAt: null,
      },
      subtotal: total,
      discount: 0,
      shipping: 0,
      tax: 0,
      total,
      notes: input.notes,
    },
  });

  for (const item of cart.items) {
    if (item.variantId) {
      await prisma.productVariant.update({
        where: { id: item.variantId },
        data: { stock: { decrement: item.quantity } },
      });
      await prisma.stockMovement.create({
        data: { variantId: item.variantId, type: 'ORDER', quantity: -item.quantity, referenceId: order.id, reason: 'Order placed' },
      });
    }
    if (item.productType === 'CUSTOMIZE' && item.fiberId && item.colorId) {
      const fiberInventory = await prisma.fiberInventory.update({
        where: { fiberId_colorId: { fiberId: item.fiberId, colorId: item.colorId } },
        data: { stock: { decrement: item.quantity } },
      });
      await prisma.stockMovement.create({
        data: { fiberInventoryId: fiberInventory.id, type: 'ORDER', quantity: -item.quantity, referenceId: order.id, reason: 'Custom order placed' },
      });
    }
  }
  await prisma.cart.update({ where: { id: cart.id }, data: { items: [], totalItems: 0, totalPrice: 0 } });

  return order;
}

export async function listOrders(ownerKey: string) {
  return prisma.order.findMany({ where: { userId: ownerKey }, orderBy: { createdAt: 'desc' } });
}

export async function getOrder(ownerKey: string, orderNumberValue: string) {
  const order = await prisma.order.findFirst({ where: { userId: ownerKey, orderNumber: orderNumberValue } });
  if (!order) throw new AppError(404, 'Order not found');
  return order;
}

export async function adminListOrders(status?: OrderStatus) {
  return prisma.order.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: 'desc' },
  });
}

export async function adminUpdateStatus(orderId: string, status: OrderStatus) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new AppError(404, 'Order not found');
  return prisma.order.update({ where: { id: orderId }, data: { status } });
}
