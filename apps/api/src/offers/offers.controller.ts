import * as offersService from './offers.service.js';
import { asyncHandler } from '../lib/asyncHandler.js';

export const listActive = asyncHandler(async (_req, res) => {
  res.json({ data: await offersService.listActive() });
});

export const adminList = asyncHandler(async (_req, res) => {
  res.json({ data: await offersService.adminList() });
});

export const adminCreate = asyncHandler(async (req, res) => {
  res.status(201).json({ data: await offersService.adminCreate(req.body) });
});

export const adminDeactivate = asyncHandler(async (req, res) => {
  res.json({ data: await offersService.adminDeactivate(req.params.id) });
});