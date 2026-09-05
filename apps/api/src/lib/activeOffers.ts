import { prisma } from './prisma.js';

export async function fetchActiveOffers() {
  const now = new Date();
  const offers = await prisma.offer.findMany({ where: { isActive: true }, orderBy: { createdAt: 'desc' } });
  return offers.filter(
    (offer) =>
      (offer.startDate === null || offer.startDate <= now) &&
      (offer.endDate === null || offer.endDate >= now)
  );
}