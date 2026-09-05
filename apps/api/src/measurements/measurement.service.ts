import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { MeasurementProfileInput } from './measurement.schemas.js';

export async function listFields() {
  return prisma.measurementField.findMany({
    where: { isActive: true },
    orderBy: { displayOrder: 'asc' },
    select: {
      id: true,
      key: true,
      label: true,
      unit: true,
      instructions: true,
      exampleImage: true,
      gifOrVideoUrl: true,
      isRequired: true,
    },
  });
}

function toMetric(value: number, unit: 'INCHES' | 'CM'): number {
  if (unit === 'CM') return Number(value.toFixed(1));
  return Number((value * 2.54).toFixed(1));
}

function toInches(value: number, unit: 'INCHES' | 'CM'): number {
  if (unit === 'INCHES') return Number(value.toFixed(2));
  return Number((value / 2.54).toFixed(2));
}

export async function getMyProfile(userId: string) {
  return prisma.measurementProfile.findFirst({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
  });
}

export async function saveMyProfile(userId: string, input: MeasurementProfileInput) {
  const fields = await prisma.measurementField.findMany({
    where: { isActive: true },
    select: { id: true, key: true, unit: true, isRequired: true },
  });
  const byKey = new Map(fields.map((field) => [field.key, field]));
  const required = fields.filter((field) => field.isRequired).map((field) => field.key);
  const provided = new Set(input.values.map((value) => value.fieldKey));
  const missing = required.filter((key) => !provided.has(key));
  if (missing.length > 0) throw new AppError(400, `Missing required measurements: ${missing.join(', ')}`);

  const values = input.values.map(({ fieldId, fieldKey, label, value, unit }) => {
    const field = byKey.get(fieldKey);
    const targetUnit = field?.unit === 'CM' ? 'CM' : 'INCHES';
    const normalizedValue =
      targetUnit === 'CM'
        ? targetUnit === unit ? value : toMetric(value, unit)
        : targetUnit === unit ? value : toInches(value, unit);
    return {
      fieldId: fieldId ?? field?.id ?? fieldKey,
      fieldKey,
      label,
      value: normalizedValue,
      unit: targetUnit,
    };
  });

  const existing = await prisma.measurementProfile.findFirst({ where: { userId } });
  if (existing) {
    return prisma.measurementProfile.update({
      where: { id: existing.id },
      data: { alias: input.alias ?? existing.alias, values },
    });
  }
  return prisma.measurementProfile.create({
    data: { userId, alias: input.alias ?? null, values },
  });
}