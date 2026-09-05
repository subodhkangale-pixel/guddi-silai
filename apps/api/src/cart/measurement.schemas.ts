import { z } from 'zod';

export const measurementSchema = z.object({
  values: z.array(z.object({
    fieldKey: z.string().min(1),
    label: z.string().min(1),
    value: z.number().finite().positive().max(200),
    unit: z.enum(['INCHES', 'CM']),
  })).min(1),
});

export type MeasurementInput = z.infer<typeof measurementSchema>;
