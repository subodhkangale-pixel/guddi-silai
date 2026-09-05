import { Request, Response } from 'express';

import * as deliveryService from './delivery.service.js';
import { asyncHandler } from '../lib/asyncHandler.js';

export const checkPincode = asyncHandler(async (req: Request, res: Response) => {
  const result = await deliveryService.lookupPincode(req.params.pincode);
  res.json({ data: result });
});

export const estimateShipping = asyncHandler(async (req: Request, res: Response) => {
  const result = await deliveryService.estimateShipping({ pincode: req.params.pincode });
  res.json({ data: result });
});