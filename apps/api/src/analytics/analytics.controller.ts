import { Request, Response } from 'express';

import * as analyticsService from './analytics.service.js';
import { asyncHandler } from '../lib/asyncHandler.js';

export const recordEvent = asyncHandler(async (req: Request, res: Response) => {
  await analyticsService.recordEvent(req.body);
  res.status(202).json({ data: { accepted: true } });
});

export const summary = asyncHandler(async (req: Request, res: Response) => {
  const from = req.query.from instanceof Date ? req.query.from : undefined;
  const to = req.query.to instanceof Date ? req.query.to : undefined;
  res.json({ data: await analyticsService.summary(from, to) });
});

export const dashboard = asyncHandler(async (req: Request, res: Response) => {
  const from = req.query.from instanceof Date ? req.query.from : undefined;
  const to = req.query.to instanceof Date ? req.query.to : undefined;
  res.json({ data: await analyticsService.dashboard(from, to) });
});
