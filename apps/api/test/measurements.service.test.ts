import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/lib/prisma.js', () => ({
  prisma: {
    measurementField: { findMany: vi.fn() },
    measurementProfile: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import { prisma } from '../src/lib/prisma.js';
import * as measurementsService from '../src/measurements/measurement.service.js';

const field = {
  id: 'f1',
  key: 'bust',
  label: 'Bust',
  unit: 'INCHES',
  instructions: 'Measure around the fullest part of your chest.',
  exampleImage: null,
  gifOrVideoUrl: null,
  isRequired: true,
};

beforeEach(() => {
  vi.clearAllMocks();
  prisma.measurementField.findMany.mockResolvedValue([field]);
});

describe('measurements service', () => {
  it('returns only active measurement fields ordered by display order', async () => {
    const result = await measurementsService.listFields();
    expect(prisma.measurementField.findMany).toHaveBeenCalledWith({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' },
      select: {
        id: true, key: true, label: true, unit: true, instructions: true,
        exampleImage: true, gifOrVideoUrl: true, isRequired: true,
      },
    });
    expect(result).toEqual([field]);
  });

  it('creates a measurement profile for a user', async () => {
    prisma.measurementProfile.findFirst.mockResolvedValue(null);
    prisma.measurementProfile.create.mockResolvedValue({ id: 'mp-1' });
    const input = {
      values: [{ fieldId: 'f1', fieldKey: 'bust', label: 'Bust', value: 34, unit: 'INCHES' as const }],
    };
    const result = await measurementsService.saveMyProfile('user-1', input);
    expect(prisma.measurementProfile.create).toHaveBeenCalledWith({
      data: { userId: 'user-1', alias: null, values: input.values },
    });
    expect(result).toEqual({ id: 'mp-1' });
  });

  it('updates the existing profile instead of creating a duplicate', async () => {
    prisma.measurementProfile.findFirst.mockResolvedValue({ id: 'mp-1', alias: 'Default', values: [] });
    prisma.measurementProfile.update.mockResolvedValue({ id: 'mp-1' });
    const input = {
      alias: 'Bridal',
      values: [{ fieldId: 'f1', fieldKey: 'bust', label: 'Bust', value: 34, unit: 'INCHES' as const }],
    };
    const result = await measurementsService.saveMyProfile('user-1', input);
    expect(prisma.measurementProfile.update).toHaveBeenCalledWith({
      where: { id: 'mp-1' },
      data: { alias: 'Bridal', values: input.values },
    });
    expect(prisma.measurementProfile.create).not.toHaveBeenCalled();
    expect(result).toEqual({ id: 'mp-1' });
  });
});