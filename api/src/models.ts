export type ISODateTime = string; // e.g., "2025-09-08T20:00:00-03:00"

export interface Restaurant {
  id: string;
  name: string;
  timezone: string; // IANA
  shifts?: Array<{ start: string; end: string }>; // "HH:mm"
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export interface Sector {
  id: string;
  restaurantId: string;
  name: string;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export interface Table {
  id: string;
  sectorId: string;
  name: string;
  minSize: number;
  maxSize: number;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export interface Customer {
  name: string;
  phone: string;
  email: string;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export interface CreateCustomer {
  name: string;
  phone: string;
  email: string;
}

export type ReservationStatus = 'CONFIRMED' | 'PENDING' | 'CANCELLED';

export interface Reservation {
  id: string;
  restaurantId: string;
  sectorId: string;
  tableIds: string[]; // CORE: single table
  partySize: number;
  startDateTimeISO: ISODateTime;
  endDateTimeISO: ISODateTime;
  status: ReservationStatus;
  customer: Customer;
  notes?: string;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export interface AvailabilitySlot {
  start: string;
  available: boolean;
  tables?: string[];
  reason?: string;
}