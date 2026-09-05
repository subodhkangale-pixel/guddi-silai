import { AppError } from '../middleware/errorHandler.js';

const SERVICEABLE_PREFIXES = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 22, 23, 24, 25, 26, 27, 28, 30, 31, 32, 33, 34, 36, 38, 39, 40, 41, 42, 43, 44, 45, 46, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 60, 61, 62, 63, 64, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 88, 89, 90, 91, 93, 94, 95, 96, 97, 98, 99];

export function lookupPincode(pincode: string) {
  const prefix = Number(pincode.slice(0, 2));
  const serviceable = SERVICEABLE_PREFIXES.includes(prefix);
  const estimateDays = serviceable ? (prefix >= 40 && prefix < 60 ? 3 : 4) : null;
  return {
    pincode,
    serviceable,
    deliveryDays: estimateDays,
    message: serviceable ? `Deliverable in ${estimateDays} business days` : 'Sorry, we do not deliver to this pincode yet',
  };
}

export async function checkPincode(input: { pincode: string }) {
  return lookupPincode(input.pincode);
}

export async function estimateShipping(input: { pincode: string }) {
  const info = lookupPincode(input.pincode);
  if (!info.serviceable) throw new AppError(400, info.message);
  const shipping = info.deliveryDays && info.deliveryDays <= 3 ? 0 : 79;
  return { ...info, shipping };
}