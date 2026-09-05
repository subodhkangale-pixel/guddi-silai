import { z } from 'zod';

export const measurementProfileSchema = z.object({
  alias: z.string().max(60).optional(),
  values: z.array(z.object({
    fieldId: z.string().min(1),
    fieldKey: z.string().min(1),
    label: z.string().min(1),
    value: z.number().finite().positive().max(200),
    unit: z.enum(['INCHES', 'CM']),
  })).min(1),
});

export type MeasurementProfileInput = z.infer<typeof measurementProfileSchema>;