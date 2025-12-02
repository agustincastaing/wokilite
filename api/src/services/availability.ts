import { DateTime, Interval } from 'luxon';
import { restaurantRepository, tableRepository, reservationRepository } from '../repositories';
import { createInterval } from '../utils/time';
import type { Restaurant, AvailabilitySlot } from '../models';

const SLOT_MINUTES = 15;
const DURATION_MINUTES = 90;

/**
 * Get restaurant by ID (throws if not found)
 */
export async function getRestaurant(id: string): Promise<Restaurant> {
  const r = await restaurantRepository.findById(id);
  if (!r) throw { status: 404, message: 'Restaurant not found' };
  return r;
}

/**
 * Check if a slot is within allowed shifts
 */
function isSlotAllowed(startDt: DateTime, restaurant: Restaurant): boolean {
  if (!restaurant.shifts || restaurant.shifts.length === 0) return true;

  const startStr = startDt.toFormat('HH:mm');
  const endStr = startDt.plus({ minutes: DURATION_MINUTES }).toFormat('HH:mm');

  return restaurant.shifts.some(shift => {
    return startStr >= shift.start && endStr <= shift.end;
  });
}

/**
 * Get potential time slots for a date
 */
export function getPotentialSlots(date: string, restaurant: Restaurant): DateTime[] {
  const day = DateTime.fromISO(date, { zone: restaurant.timezone }).startOf('day');
  const slots: DateTime[] = [];

  for (let i = 0; i < 96; i++) {
    const slotStart = day.plus({ minutes: i * SLOT_MINUTES });
    if (isSlotAllowed(slotStart, restaurant)) {
      slots.push(slotStart);
    }
  }

  return slots;
}

/**
 * Get availability for a restaurant/sector/date/partySize
 */
export async function getAvailability(
  restaurantId: string,
  sectorId: string,
  date: string,
  partySize: number
): Promise<AvailabilitySlot[]> {
  const restaurant = await restaurantRepository.findById(restaurantId);
  if (!restaurant) throw { status: 404, message: 'Restaurant not found' };

  // Use restaurant timezone for the 'day' definition
  const dayStart = DateTime.fromISO(date).setZone(restaurant.timezone).startOf('day');

  // Get all tables in sector that fit party size
  const candidateTables = await tableRepository.findBySectorAndCapacity(sectorId, partySize);

  // Get all confirmed reservations for this restaurant/sector
  const reservations = await reservationRepository.findConfirmedByRestaurantAndSector(
    restaurantId,
    sectorId
  );

  const slots: AvailabilitySlot[] = [];

  // Generate 96 slots (24h * 4)
  for (let i = 0; i < 96; i++) {
    const slotStart = dayStart.plus({ minutes: i * SLOT_MINUTES });
    const slotEnd = slotStart.plus({ minutes: DURATION_MINUTES });
    const slotInterval = Interval.fromDateTimes(slotStart, slotEnd);

    // 1. Shift Check
    let inShift = true;
    if (restaurant.shifts && restaurant.shifts.length > 0) {
      const sStr = slotStart.toFormat('HH:mm');
      const eStr = slotEnd.toFormat('HH:mm');
      inShift = restaurant.shifts.some(shift => {
        const startFits = sStr >= shift.start;
        const endFits = eStr <= shift.end;
        const crossesMidnight = eStr < sStr;

        return startFits && endFits && !crossesMidnight;
      });
    }

    if (!inShift) {
      slots.push({ start: slotStart.toISO()!, available: false, reason: 'closed' });
      continue;
    }

    if (candidateTables.length === 0) {
      slots.push({ start: slotStart.toISO()!, available: false, reason: 'no_capacity' });
      continue;
    }

    // 2. Capacity Check
    // Find tables that do NOT overlap with existing confirmed reservations
    const availableTableIds = candidateTables.filter(t => {
      const isBooked = reservations.some(res => {
        if (res.status !== 'CONFIRMED') return false;
        if (res.sectorId !== sectorId || res.restaurantId !== restaurantId) return false;

        // Check if this table is in this reservation
        if (!res.tableIds.includes(t.id)) return false;

        const resInterval = createInterval(
          res.startDateTimeISO,
          res.endDateTimeISO,
          restaurant.timezone
        );

        // Check for overlap
        return slotInterval.overlaps(resInterval);
      });
      return !isBooked;
    }).map(t => t.id);

    slots.push({
      start: slotStart.toISO()!,
      available: availableTableIds.length > 0,
      tables: availableTableIds.length > 0 ? availableTableIds : undefined,
      reason: availableTableIds.length === 0 ? 'no_capacity' : undefined,
    });
  }

  return slots;
}