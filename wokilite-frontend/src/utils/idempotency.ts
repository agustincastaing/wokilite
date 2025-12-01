// src/utils/idempotency.ts

export function generateReservationIdempotencyKey(payload: {
  restaurantId: string;
  sectorId: string;
  startDateTimeISO: string;
  partySize: number;
  customer: {
    email?: string;
    phone?: string;
  };
}): string {
  const data = JSON.stringify({
    restaurantId: payload.restaurantId,
    sectorId: payload.sectorId,
    startDateTimeISO: payload.startDateTimeISO,
    partySize: payload.partySize,
    customerIdentifier: payload.customer.email || payload.customer.phone,
  });

  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  return `res-${Math.abs(hash).toString(16).padStart(8, '0')}`;
}