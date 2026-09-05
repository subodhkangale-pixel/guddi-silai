import * as notificationsService from './notifications.service.js';
import { asyncHandler } from '../lib/asyncHandler.js';

export const list = asyncHandler(async (req, res) => {
  if (!req.identity) throw new Error('Missing identity');
  res.json({ data: await notificationsService.listForIdentity(req.identity.id, req.identity.type) });
});

export const markRead = asyncHandler(async (req, res) => {
  if (!req.identity || req.identity.type !== 'user') throw new Error('Authenticated user required');
  res.json({ data: await notificationsService.markRead(req.identity.id, req.params.id) });
});
