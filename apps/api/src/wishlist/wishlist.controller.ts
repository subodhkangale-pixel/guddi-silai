import { asyncHandler } from '../lib/asyncHandler.js';
import * as wishlistService from './wishlist.service.js';

function userId(req: Express.Request) {
  if (!req.user) throw new Error('Missing user');
  return req.user.id;
}

export const getWishlist = asyncHandler(async (req, res) => {
  res.json({ data: await wishlistService.getWishlist(userId(req)) });
});

export const addItem = asyncHandler(async (req, res) => {
  res.status(201).json({ data: await wishlistService.addItem(userId(req), req.body) });
});

export const removeItem = asyncHandler(async (req, res) => {
  res.json({ data: await wishlistService.removeItem(userId(req), req.params.productId) });
});