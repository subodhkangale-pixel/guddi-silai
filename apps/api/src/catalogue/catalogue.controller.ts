import { Request, Response } from 'express';

import * as catalogueService from './catalogue.service.js';
import { logAdminActivity } from '../middleware/adminAuth.js';
import { asyncHandler } from '../lib/asyncHandler.js';

type IdParam = { id: string };
type SearchQuery = { q?: string; categoryId?: string; includeInactive?: string };

function listOptions(query: SearchQuery) {
  return {
    search: query.q,
    categoryId: query.categoryId,
    includeInactive: query.includeInactive === 'true',
  };
}

function publicList<T>(
  list: (_options: catalogueService.ListOptions) => Promise<T[]>
) {
  return asyncHandler(async (req: Request, res: Response) => {
    const items = await list(listOptions(req.query as SearchQuery));
    res.json({ data: items });
  });
}

function adminDelete(
  softDelete: (_id: string) => Promise<{ id: string }>,
  label: string
) {
  return asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as IdParam;
    await softDelete(id);
    await logAdminActivity(req.admin!.id, req, {
      action: 'catalogue.soft_delete',
      targetType: label,
      targetId: id,
    });
    res.json({ data: { id, deleted: true } });
  });
}

// ──────────────────────────────────────────────
// Public reads
// ──────────────────────────────────────────────

export const getCategories = publicList(catalogueService.listCategories);
export const getSubCategories = publicList(catalogueService.listSubCategories);
export const getColors = publicList(catalogueService.listColors);
export const getSizes = publicList(catalogueService.listSizes);
export const getFibers = publicList(catalogueService.listFibers);
export const getEmbroideries = publicList(catalogueService.listEmbroideries);

// ──────────────────────────────────────────────
// Admin: list (incl. inactive, searchable)
// ──────────────────────────────────────────────

export const adminListCategories = publicList((options) =>
  catalogueService.listCategories({ ...options, includeInactive: true })
);
export const adminListSubCategories = publicList((options) =>
  catalogueService.listSubCategories({ ...options, includeInactive: true })
);
export const adminListColors = publicList((options) =>
  catalogueService.listColors({ ...options, includeInactive: true })
);
export const adminListSizes = publicList((options) =>
  catalogueService.listSizes({ ...options, includeInactive: true })
);
export const adminListFibers = publicList((options) =>
  catalogueService.listFibers({ ...options, includeInactive: true })
);
export const adminListEmbroideries = publicList((options) =>
  catalogueService.listEmbroideries({ ...options, includeInactive: true })
);

// ──────────────────────────────────────────────
// Admin: create / update / delete per entity
// ──────────────────────────────────────────────

export const createCategory = asyncHandler(async (req, res) => {
  const created = await catalogueService.createCategory(req.body);
  await logAdminActivity(req.admin!.id, req, {
    action: 'catalogue.create',
    targetType: 'category',
    targetId: created.id,
    after: { name: created.name },
  });
  res.status(201).json({ data: created });
});

export const updateCategory = asyncHandler(async (req, res) => {
  const updated = await catalogueService.updateCategory(req.params.id, req.body);
  await logAdminActivity(req.admin!.id, req, {
    action: 'catalogue.update',
    targetType: 'category',
    targetId: updated.id,
    after: { name: updated.name },
  });
  res.json({ data: updated });
});

export const deleteCategory = adminDelete(
  catalogueService.softDeleteCategory,
  'category'
);

export const createSubCategory = asyncHandler(async (req, res) => {
  const created = await catalogueService.createSubCategory(req.body);
  await logAdminActivity(req.admin!.id, req, {
    action: 'catalogue.create',
    targetType: 'subcategory',
    targetId: created.id,
    after: { name: created.name },
  });
  res.status(201).json({ data: created });
});

export const updateSubCategory = asyncHandler(async (req, res) => {
  const updated = await catalogueService.updateSubCategory(
    req.params.id,
    req.body
  );
  await logAdminActivity(req.admin!.id, req, {
    action: 'catalogue.update',
    targetType: 'subcategory',
    targetId: updated.id,
    after: { name: updated.name },
  });
  res.json({ data: updated });
});

export const deleteSubCategory = adminDelete(
  catalogueService.softDeleteSubCategory,
  'subcategory'
);

export const createColor = asyncHandler(async (req, res) => {
  const created = await catalogueService.createColor(req.body);
  await logAdminActivity(req.admin!.id, req, {
    action: 'catalogue.create',
    targetType: 'color',
    targetId: created.id,
    after: { name: created.name },
  });
  res.status(201).json({ data: created });
});

export const updateColor = asyncHandler(async (req, res) => {
  const updated = await catalogueService.updateColor(req.params.id, req.body);
  await logAdminActivity(req.admin!.id, req, {
    action: 'catalogue.update',
    targetType: 'color',
    targetId: updated.id,
    after: { name: updated.name },
  });
  res.json({ data: updated });
});

export const deleteColor = adminDelete(
  catalogueService.softDeleteColor,
  'color'
);

export const createSize = asyncHandler(async (req, res) => {
  const created = await catalogueService.createSize(req.body);
  await logAdminActivity(req.admin!.id, req, {
    action: 'catalogue.create',
    targetType: 'size',
    targetId: created.id,
    after: { name: created.name },
  });
  res.status(201).json({ data: created });
});

export const updateSize = asyncHandler(async (req, res) => {
  const updated = await catalogueService.updateSize(req.params.id, req.body);
  await logAdminActivity(req.admin!.id, req, {
    action: 'catalogue.update',
    targetType: 'size',
    targetId: updated.id,
    after: { name: updated.name },
  });
  res.json({ data: updated });
});

export const deleteSize = adminDelete(catalogueService.softDeleteSize, 'size');

export const createFiber = asyncHandler(async (req, res) => {
  const created = await catalogueService.createFiber(req.body);
  await logAdminActivity(req.admin!.id, req, {
    action: 'catalogue.create',
    targetType: 'fiber',
    targetId: created.id,
    after: { name: created.name },
  });
  res.status(201).json({ data: created });
});

export const updateFiber = asyncHandler(async (req, res) => {
  const updated = await catalogueService.updateFiber(req.params.id, req.body);
  await logAdminActivity(req.admin!.id, req, {
    action: 'catalogue.update',
    targetType: 'fiber',
    targetId: updated.id,
    after: { name: updated.name },
  });
  res.json({ data: updated });
});

export const deleteFiber = adminDelete(
  catalogueService.softDeleteFiber,
  'fiber'
);

export const createEmbroidery = asyncHandler(async (req, res) => {
  const created = await catalogueService.createEmbroidery(req.body);
  await logAdminActivity(req.admin!.id, req, {
    action: 'catalogue.create',
    targetType: 'embroidery',
    targetId: created.id,
    after: { name: created.name },
  });
  res.status(201).json({ data: created });
});

export const updateEmbroidery = asyncHandler(async (req, res) => {
  const updated = await catalogueService.updateEmbroidery(
    req.params.id,
    req.body
  );
  await logAdminActivity(req.admin!.id, req, {
    action: 'catalogue.update',
    targetType: 'embroidery',
    targetId: updated.id,
    after: { name: updated.name },
  });
  res.json({ data: updated });
});

export const deleteEmbroidery = adminDelete(
  catalogueService.softDeleteEmbroidery,
  'embroidery'
);