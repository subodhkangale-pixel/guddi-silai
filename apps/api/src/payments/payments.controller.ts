import { Request, Response } from 'express';

import * as paymentsService from './payments.service.js';
import { asyncHandler } from '../lib/asyncHandler.js';

export const createPayment = asyncHandler(async (req: Request, res: Response) => {
  if (!req.identity) throw new Error('Missing identity');
  const result = await paymentsService.createPayment(req.identity.id, req.body);
  res.json({ data: result });
});

export const verifyPayment = asyncHandler(async (req: Request, res: Response) => {
  if (!req.identity) throw new Error('Missing identity');
  const order = await paymentsService.verifyPayment(req.identity.id, req.body);
  res.json({ data: order });
});

export const webhook = asyncHandler(async (req: Request, res: Response) => {
  const result = await paymentsService.handleWebhook(req.headers['x-razorpay-signature'] as string | undefined, req.rawBody, req.body);
  res.json(result);
});
