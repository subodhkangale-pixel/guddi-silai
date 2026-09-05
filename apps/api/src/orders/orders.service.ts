import { OrderStatus, PaymentMethod, PaymentStatus } from '@prisma/client';
import { ORDER_STATUS_FLOW, ORDER_TERMINAL_STATUSES } from '@guddi-silai/shared';

import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { CreateOrderInput } from './orders.schemas.js';
import * as notificationsService from '../notifications/notifications.service.js';

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

  const subtotal = Number(cart.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0).toFixed(2));
  const couponDiscount = Number((cart.couponCode ? (cart.discount ?? 0) : 0).toFixed(2));
  const discount = Number((cart.discount ?? 0).toFixed(2));
  const baseTotal = Number(cart.totalPrice.toFixed(2));
  const coupon = cart.couponCode ? await prisma.coupon.findUnique({ where: { code: cart.couponCode } }) : null;

  const addonIds = input.addonIds ?? [];
  const addons = addonIds.length
    ? await prisma.addon.findMany({ where: { id: { in: addonIds }, isActive: true } })
    : [];
  if (addons.length !== addonIds.length) {
    throw new AppError(400, 'One or more add-ons are unavailable');
  }
  const addonTotal = Number(addons.reduce((sum, addon) => sum + addon.price, 0).toFixed(2));
  const shippingTotal = Number((input.shipping ?? 0).toFixed(2));
  const total = Number((baseTotal + addonTotal + shippingTotal).toFixed(2));

  const offerApplied = (cart.offerDiscount ?? 0) > 0;
  const offer: { name: string; type: string; discount: number } | null = offerApplied
    ? { name: 'Auto-applied offer', type: 'AUTO', discount: Number((cart.offerDiscount ?? 0).toFixed(2)) }
    : null;

  const fields = await prisma.measurementField.findMany({
    where: { isActive: true },
    select: { key: true, id: true },
  });
  const fieldByKey = new Map(fields.map((field) => [field.key, field.id]));
  const measurementSnapshotFor = (item: (typeof cart.items)[number]) => {
    if (item.productType !== 'CUSTOMIZE' || !Array.isArray(item.measurementValues)) return null;
    const values = item.measurementValues as { fieldKey: string; label: string; value: number; unit: string }[];
    return {
      values: values.map((measurement) => ({
        fieldId: fieldByKey.get(measurement.fieldKey) ?? measurement.fieldKey,
        fieldKey: measurement.fieldKey,
        label: measurement.label,
        value: measurement.value,
        unit: measurement.unit,
      })),
      measurementInstructionVersion: 1,
      sourceProfileId: null,
    };
  };

  const paymentMethod = input.paymentMethod as string;
  const storedMethod =
    paymentMethod === 'COD' ? PaymentMethod.COD
    : paymentMethod === 'UPI' ? PaymentMethod.UPI
    : paymentMethod === 'NET_BANKING' ? PaymentMethod.NET_BANKING
    : PaymentMethod.RAZORPAY;

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
        styleOptions: item.styleOptions ?? null,
        customizationNotes: null,
        total: Number((item.unitPrice * item.quantity).toFixed(2)),
      })),
      addons: addons.map((addon) => ({
        addonId: addon.id,
        name: addon.name,
        price: addon.price,
      })),
      payment: {
        method: storedMethod,
        status: PaymentStatus.PENDING,
        transactionId: null,
        amount: total,
        paidAt: null,
      },
      coupon: coupon ? { code: coupon.code, type: coupon.type, discount: couponDiscount } : null,
      offer: offer,
      subtotal,
      discount,
      shipping: shippingTotal,
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
  if (coupon) await prisma.coupon.update({ where: { id: coupon.id }, data: { usedCount: { increment: 1 } } });
  if (ownerKey) {
    await notificationsService.createForUser(ownerKey, 'Order placed', `Your order ${order.orderNumber} has been placed.`, 'ORDER_PLACED');
    await notificationsService.createForAdmins('New order received', `Order ${order.orderNumber} is ready for review.`, 'NEW_ORDER');
  }

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

export async function adminGetOrder(orderId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new AppError(404, 'Order not found');
  return order;
}

export async function adminUpdateStatus(orderId: string, status: OrderStatus) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new AppError(404, 'Order not found');
  if (order.status !== status) {
    const currentIndex = ORDER_STATUS_FLOW.indexOf(order.status as (typeof ORDER_STATUS_FLOW)[number]);
    const nextIndex = ORDER_STATUS_FLOW.indexOf(status as (typeof ORDER_STATUS_FLOW)[number]);
    const isTerminal = ORDER_TERMINAL_STATUSES.includes(status as (typeof ORDER_TERMINAL_STATUSES)[number]);
    const canCancel = isTerminal && status === 'CANCELLED' && !ORDER_TERMINAL_STATUSES.includes(order.status as (typeof ORDER_TERMINAL_STATUSES)[number]);
    if (!canCancel && (currentIndex < 0 || nextIndex !== currentIndex + 1)) {
      throw new AppError(409, `Invalid order transition from ${order.status} to ${status}`);
    }
  }
  return prisma.order.update({ where: { id: orderId }, data: { status } });
}
