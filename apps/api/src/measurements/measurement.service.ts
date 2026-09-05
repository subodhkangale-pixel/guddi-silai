import { prisma } from '../lib/prisma.js';
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

export async function getMyProfile(userId: string) {
  return prisma.measurementProfile.findFirst({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
  });
}

export async function saveMyProfile(userId: string, input: MeasurementProfileInput) {
  const values = input.values.map(({ fieldId, fieldKey, label, value, unit }) => ({
    fieldId,
    fieldKey,
    label,
    value,
    unit,
  }));
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