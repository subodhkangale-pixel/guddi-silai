import { apiRequest } from './client';

export interface PincodeResult {
  pincode: string;
  serviceable: boolean;
  deliveryDays: number | null;
  message: string;
}

export interface ShippingEstimate extends PincodeResult {
  shipping: number;
}

export async function checkPincode(pincode: string) {
  return apiRequest<{ data: PincodeResult }>(`/delivery/pincode/${pincode}`);
}

export async function estimateShipping(pincode: string) {
  return apiRequest<{ data: ShippingEstimate }>(`/delivery/pincode/${pincode}/shipping`);
}