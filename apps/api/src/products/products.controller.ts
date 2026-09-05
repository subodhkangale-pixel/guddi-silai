import { Request, Response } from 'express';

import * as productsService from './products.service.js';
import { logAdminActivity } from '../middleware/adminAuth.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import { ProductQueryParams, AdminProductQueryParams } from './products.schemas.js';

// ──────────────────────────────────────────────
// Public
// ──────────────────────────────────────────────

export const listProducts = asyncHandler(async (req: Request, res: Response) => {
  const params = req.query as unknown as ProductQueryParams;
  const result = await productsService.listProducts(params);
  res.json({ data: result.data, nextCursor: result.nextCursor, hasMore: result.hasMore });
});

export const getProductBySlug = asyncHandler(async (req: Request, res: Response) => {
  const product = await productsService.getProductBySlug(req.params.slug);
  res.json({ data: product });
});

// ──────────────────────────────────────────────
// Admin: products
// ──────────────────────────────────────────────

export const adminListProducts = asyncHandler(
  async (req: Request, res: Response) => {
    const params = req.query as unknown as AdminProductQueryParams;
    const result = await productsService.adminListProducts(params);
    res.json({ data: result });
  }
);

export const adminGetProduct = asyncHandler(
  async (req: Request, res: Response) => {
    const product = await productsService.getAdminProduct(req.params.id);
    res.json({ data: product });
  }
);

export const adminCreateProduct = asyncHandler(
  async (req: Request, res: Response) => {
    const created = await productsService.createProduct(req.body);
    await logAdminActivity(req.admin!.id, req, {
      action: 'product.create',
      targetType: 'product',
      targetId: created.id,
      after: { name: created.name, type: created.type },
    });
    res.status(201).json({ data: created });
  }
);

export const adminUpdateProduct = asyncHandler(
  async (req: Request, res: Response) => {
    const updated = await productsService.updateProduct(req.params.id, req.body);
    await logAdminActivity(req.admin!.id, req, {
      action: 'product.update',
      targetType: 'product',
      targetId: updated.id,
      after: { name: updated.name },
    });
    res.json({ data: updated });
  }
);

export const adminDeleteProduct = asyncHandler(
  async (req: Request, res: Response) => {
    await productsService.softDeleteProduct(req.params.id);
    await logAdminActivity(req.admin!.id, req, {
      action: 'product.soft_delete',
      targetType: 'product',
      targetId: req.params.id,
    });
    res.json({ data: { id: req.params.id, deleted: true } });
  }
);

// ──────────────────────────────────────────────
// Admin: variants
// ──────────────────────────────────────────────

export const adminAddVariant = asyncHandler(
  async (req: Request, res: Response) => {
    const created = await productsService.addVariant(req.params.id, req.body);
    await logAdminActivity(req.admin!.id, req, {
      action: 'product.variant_create',
      targetType: 'product',
      targetId: req.params.id,
      after: { variantId: created.id, sku: created.sku },
    });
    res.status(201).json({ data: created });
  }
);

export const adminUpdateVariant = asyncHandler(
  async (req: Request, res: Response) => {
    const updated = await productsService.updateVariant(req.params.id, req.body);
    await logAdminActivity(req.admin!.id, req, {
      action: 'product.variant_update',
      targetType: 'variant',
      targetId: updated.id,
    });
    res.json({ data: updated });
  }
);

export const adminDeleteVariant = asyncHandler(
  async (req: Request, res: Response) => {
    await productsService.deleteVariant(req.params.id);
    await logAdminActivity(req.admin!.id, req, {
      action: 'product.variant_delete',
      targetType: 'variant',
      targetId: req.params.id,
    });
    res.json({ data: { id: req.params.id, deleted: true } });
  }
);