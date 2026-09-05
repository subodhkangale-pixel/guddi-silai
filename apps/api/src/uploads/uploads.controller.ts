import { Request, Response } from 'express';
import { v2 as cloudinary } from 'cloudinary';

import { env } from '../config/env.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import { AppError } from '../middleware/errorHandler.js';

function uploadImage(buffer: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'guddi-silai/products',
        resource_type: 'image',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'avif'],
      },
      (error, result) => {
        if (error) return reject(error);
        if (!result?.secure_url) return reject(new Error('Cloudinary did not return an image URL'));
        return resolve(result.secure_url);
      }
    );
    stream.end(buffer);
  });
}

export const uploadProductImages = asyncHandler(async (req: Request, res: Response) => {
  if (!env.cloudinary.cloudName || !env.cloudinary.apiKey || !env.cloudinary.apiSecret) {
    throw new AppError(503, 'Image uploads are not configured');
  }

  const files = (req.files ?? []) as Express.Multer.File[];
  if (files.length === 0) throw new AppError(400, 'Choose at least one image to upload');

  cloudinary.config({
    cloud_name: env.cloudinary.cloudName,
    api_key: env.cloudinary.apiKey,
    api_secret: env.cloudinary.apiSecret,
    secure: true,
  });

  let urls: string[];
  try {
    urls = await Promise.all(files.map((file) => uploadImage(file.buffer)));
  } catch (error) {
    const providerError = error as { error?: { message?: string }; message?: string };
    throw new AppError(502, `Cloudinary upload failed: ${providerError.error?.message ?? providerError.message ?? 'unknown provider error'}`);
  }
  res.status(201).json({ data: { urls } });
});
