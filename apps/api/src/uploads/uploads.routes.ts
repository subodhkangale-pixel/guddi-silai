import { Router } from 'express';
import multer from 'multer';

import { requireAdmin, authorize } from '../middleware/adminAuth.js';
import { AppError } from '../middleware/errorHandler.js';
import { uploadProductImages } from './uploads.controller.js';

const router: Router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024, files: 10 },
  fileFilter: (_req, file, callback) => {
    if (!file.mimetype.startsWith('image/')) {
      callback(new AppError(400, 'Only image files can be uploaded'));
      return;
    }
    callback(null, true);
  },
});

router.post(
  '/images',
  requireAdmin,
  authorize('product:write'),
  upload.array('images', 10),
  uploadProductImages
);

export default router;
