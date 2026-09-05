import { Request, Response } from 'express';

import * as cartService from './cart.service.js';
import { asyncHandler } from '../lib/asyncHandler.js';

function owner(req: Request) {
  if (!req.identity) throw new Error('Missing identity');
  return req.identity;
}

export const getCart = asyncHandler(async (req: Request, res: Response) => {
  const cart = await cartService.getCart(owner(req).id);
  res.json({ data: cart });
});

export const addItem = asyncHandler(async (req: Request, res: Response) => {
  const identity = owner(req);
  const cart = await cartService.addItem(identity.id, identity.type === 'user' ? identity.id : undefined, req.body);
  res.status(201).json({ data: cart });
});

export const updateItem = asyncHandler(async (req: Request, res: Response) => {
  const cart = await cartService.updateItem(owner(req).id, Number(req.params.index), req.body);
  res.json({ data: cart });
});

export const removeItem = asyncHandler(async (req: Request, res: Response) => {
  const cart = await cartService.removeItem(owner(req).id, Number(req.params.index));
  res.json({ data: cart });
});

export const updateMeasurements = asyncHandler(async (req: Request, res: Response) => {
  const cart = await cartService.updateMeasurements(owner(req).id, Number(req.params.index), req.body);
  res.json({ data: cart });
});

export const updateStyleOptions = asyncHandler(async (req: Request, res: Response) => {
  const cart = await cartService.updateStyleOptions(owner(req).id, Number(req.params.index), req.body);
  res.json({ data: cart });
});

export const clearCart = asyncHandler(async (req: Request, res: Response) => {
  const cart = await cartService.clearCart(owner(req).id);
  res.json({ data: cart });
});
