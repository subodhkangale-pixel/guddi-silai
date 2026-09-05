import { Request, Response } from 'express';

import * as ordersService from './orders.service.js';
import { asyncHandler } from '../lib/asyncHandler.js';

export const createOrder = asyncHandler(async (req: Request, res: Response) => {
  if (!req.identity) throw new Error('Missing identity');
  const order = await ordersService.createOrder(req.identity.id, req.body);
  res.status(201).json({ data: order });
});

export const listOrders = asyncHandler(async (req: Request, res: Response) => {
  if (!req.identity) throw new Error('Missing identity');
  const orders = await ordersService.listOrders(req.identity.id);
  res.json({ data: orders });
});

export const getOrder = asyncHandler(async (req: Request, res: Response) => {
  if (!req.identity) throw new Error('Missing identity');
  const order = await ordersService.getOrder(req.identity.id, req.params.orderNumber);
  res.json({ data: order });
});

export const adminListOrders = asyncHandler(async (req: Request, res: Response) => {
  const orders = await ordersService.adminListOrders(req.query.status as never);
  res.json({ data: orders });
});

export const adminUpdateStatus = asyncHandler(async (req: Request, res: Response) => {
  const updated = await ordersService.adminUpdateStatus(req.params.id, req.body.status);
  res.json({ data: updated });
});

export const getAdminOrder = asyncHandler(async (req: Request, res: Response) => {
  const order = await ordersService.adminGetOrder(req.params.id);
  res.json({ data: order });
});
