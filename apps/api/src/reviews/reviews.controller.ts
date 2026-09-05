import { asyncHandler } from '../lib/asyncHandler.js';
import * as reviewsService from './reviews.service.js';

export const listApproved = asyncHandler(async (req, res) => {
  res.json({ data: await reviewsService.listApproved(req.params.productId) });
});

export const createReview = asyncHandler(async (req, res) => {
  if (!req.user) throw new Error('Missing user');
  res.status(201).json({ data: await reviewsService.createReview(req.user.id, req.body) });
});

export const listForAdmin = asyncHandler(async (req, res) => {
  res.json({ data: await reviewsService.listForAdmin(req.query.status as string | undefined) });
});

export const moderate = asyncHandler(async (req, res) => {
  res.json({ data: await reviewsService.moderate(req.params.id, req.body.status) });
});
