import { DateTime, Interval } from 'luxon';
import { v4 as uuidv4 } from 'uuid';
import {
  restaurantRepository,
  tableRepository,
  reservationRepository,
} from '../repositories';
import { createInterval } from '../utils/time';
import type { Reservation, Customer, CreateCustomer } from '../models';
import { getRestaurant } from './availability';

const DURATION_MINUTES = 90;

// In-memory locks for concurrency control (consider Redis for production)
const slotLocks = new Map<string, Promise<unknown>>();

/**
 * Create a new reservation
 */
export async function createReservation(
  restaurantId: string,
  sectorId: string,
  partySize: number,
  startDateTimeISO: string,
  customer: CreateCustomer,
  notes: string | undefined,
  idempotencyKey: string
): Promise<Reservation> {
  // 1. Idempotency Check
  const existing = await reservationRepository.findByIdempotencyKey(idempotencyKey);
  if (existing) {
    return existing;
  }

  const restaurant = await getRestaurant(restaurantId);

  // Ensure we work in the Restaurant's timezone for all math
  const start = DateTime.fromISO(startDateTimeISO).setZone(restaurant.timezone);

  if (!start.isValid) throw { status: 400, message: 'Invalid startDateTimeISO' };

  // 2. Validate Grid (15 mins)
  if (start.minute % 15 !== 0 || start.second !== 0 || start.millisecond !== 0) {
    throw { status: 422, message: 'Start time must be on a 15-minute grid' };
  }

  // 3. Shift Validation
  const end = start.plus({ minutes: DURATION_MINUTES });
  if (restaurant.shifts && restaurant.shifts.length > 0) {
    const startStr = start.toFormat('HH:mm');
    const endStr = end.toFormat('HH:mm');
    const fits = restaurant.shifts.some(s => startStr >= s.start && endStr <= s.end);
    if (!fits) throw { status: 422, message: 'outside_service_window' };
  }

  // 4. Identify Candidate Tables
  const suitableTables = await tableRepository.findBySectorAndCapacity(sectorId, partySize);

  if (suitableTables.length === 0) {
    throw { status: 409, message: 'no_capacity' };
  }

  // 5. Locking (Concurrency Control)
  const lockKey = `${sectorId}:${start.toFormat("yyyy-MM-dd'T'HH:mm")}`;
  const previous = slotLocks.get(lockKey) || Promise.resolve();

  const myExecution = previous
    .catch(() => {})
    .then(async () => {
      // Create the interval for the NEW reservation
      const newReservationInterval = Interval.fromDateTimes(start, end);

      // Check for duplicate reservation
      const duplicateReservation = await reservationRepository.findDuplicate(
        restaurantId,
        sectorId,
        start.toISO()!,
        customer.email!,
        customer.phone!
      );

      if (duplicateReservation) {
        throw {
          status: 409,
          message: 'duplicate_reservation',
          detail: 'Customer already has a reservation at this time',
        };
      }

      // Get all confirmed reservations for this restaurant/sector
      const reservations = await reservationRepository.findConfirmedByRestaurantAndSector(
        restaurantId,
        sectorId
      );

      // Find available table
      const availableTable = suitableTables.find(table => {
        const isOccupied = reservations.some(res => {
          if (res.status !== 'CONFIRMED') return false;
          if (res.restaurantId !== restaurantId || res.sectorId !== sectorId) return false;
          if (!res.tableIds.includes(table.id)) return false;

          const existingReservationInterval = createInterval(
            res.startDateTimeISO,
            res.endDateTimeISO,
            restaurant.timezone
          );

          // Check for overlap
          return newReservationInterval.overlaps(existingReservationInterval);
        });
        return !isOccupied;
      });

      if (!availableTable) {
        throw { status: 409, message: 'no_capacity' };
      }

      // Create Reservation
      const reservation = await reservationRepository.create({
        restaurantId,
        sectorId,
        tableIds: [availableTable.id],
        partySize,
        startDateTimeISO: start.toISO()!,
        endDateTimeISO: end.toISO()!,
        customer,
        notes,
        idempotencyKey,
        status: 'CONFIRMED',
      });

      return reservation;
    });

  slotLocks.set(lockKey, myExecution);

  return myExecution;
}

/**
 * Delete (cancel) a reservation
 */
export async function deleteReservation(reservationId: string): Promise<Reservation | null> {
  const reservation = await reservationRepository.findById(reservationId);

  if (!reservation || reservation.status !== 'CONFIRMED') {
    return null;
  }

  // Delete idempotency key to allow rebooking
  await reservationRepository.clearIdempotencyKey(reservationId);

  // Update status to CANCELLED
  const updated = await reservationRepository.updateStatus(reservationId, 'CANCELLED');

  return updated;
}

/**
 * Get reservations for a specific day
 */
export async function getReservationsByDay(
  restaurantId: string,
  date: string,
  sectorId?: string
): Promise<Reservation[]> {
  return reservationRepository.findByDay(restaurantId, date, sectorId);
}