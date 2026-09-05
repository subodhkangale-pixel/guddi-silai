import { Request, Response } from 'express';

import * as measurementsService from './measurement.service.js';
import { asyncHandler } from '../lib/asyncHandler.js';

export const listFields = asyncHandler(async (_req: Request, res: Response) => {
  res.json({ data: await measurementsService.listFields() });
});

export const getMyProfile = asyncHandler(async (req: Request, res: Response) => {
  res.json({ data: await measurementsService.getMyProfile(req.user!.id) });
});

export const saveMyProfile = asyncHandler(async (req: Request, res: Response) => {
  res.json({ data: await measurementsService.saveMyProfile(req.user!.id, req.body) });
});