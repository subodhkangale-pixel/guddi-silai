import { apiRequest } from './client';

export interface MeasurementField {
  id: string;
  key: string;
  label: string;
  unit: 'INCHES' | 'CM';
  instructions: string | null;
  exampleImage: string | null;
  gifOrVideoUrl: string | null;
  isRequired: boolean;
}

export interface MeasurementProfile {
  id: string;
  alias: string | null;
  values: { fieldId: string; fieldKey: string; label: string; value: number; unit: 'INCHES' | 'CM' }[];
}

export async function getMeasurementFields(): Promise<{ data: MeasurementField[] }> {
  return apiRequest('/measurements/fields');
}

export async function getMyMeasurementProfile(token: string): Promise<{ data: MeasurementProfile | null }> {
  return apiRequest('/measurements/my-profile', { token });
}

export async function saveMyMeasurementProfile(token: string, input: { alias?: string; values: { fieldId: string; fieldKey: string; label: string; value: number; unit: 'INCHES' | 'CM' }[] }) {
  return apiRequest('/measurements/my-profile', { method: 'PUT', token, body: input });
}