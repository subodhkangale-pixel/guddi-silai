import * as couponsService from './coupons.service.js';
import { asyncHandler } from '../lib/asyncHandler.js';

export const apply = asyncHandler(async (req, res) => {
  if (!req.identity) throw new Error('Missing identity');
  res.json({ data: await couponsService.applyCoupon(req.identity.id, req.body) });
});

export const remove = asyncHandler(async (req, res) => {
  if (!req.identity) throw new Error('Missing identity');
  res.json({ data: await couponsService.removeCoupon(req.identity.id) });
});

export const adminList = asyncHandler(async (_req, res) => {
  res.json({ data: await couponsService.adminList() });
});

export const adminCreate = asyncHandler(async (req, res) => {
  res.status(201).json({ data: await couponsService.adminCreate(req.body) });
});
