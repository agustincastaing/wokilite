import { DateTime, Interval } from 'luxon';
import { v4 as uuidv4 } from 'uuid';
import { reservations, tables } from '../data';
import { getRestaurant } from './availability';
import { createInterval } from '../utils/time';
const DURATION_MINUTES = 90;
const idempotencyStore = new Map();
const slotLocks = new Map();
export async function createReservation(restaurantId, sectorId, partySize, startDateTimeISO, customer, notes, idempotencyKey) {
    // 1. Idempotency Check
    if (idempotencyStore.has(idempotencyKey)) {
        return idempotencyStore.get(idempotencyKey);
    }
    const restaurant = getRestaurant(restaurantId);
    // Ensure we work in the Restaurant's timezone for all math
    const start = DateTime.fromISO(startDateTimeISO).setZone(restaurant.timezone);
    if (!start.isValid)
        throw { status: 400, message: 'Invalid startDateTimeISO' };
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
        if (!fits)
            throw { status: 422, message: 'outside_service_window' };
    }
    // 4. Identify Candidate Tables
    // Filter by sector AND capacity
    const sectorTables = tables.filter(t => t.sectorId === sectorId);
    const suitableTables = sectorTables
        .filter(t => t.minSize <= partySize && partySize <= t.maxSize)
        .sort((a, b) => a.maxSize - b.maxSize); // Optimize: Fill smallest tables first
    if (suitableTables.length === 0) {
        throw { status: 409, message: 'no_capacity' };
    }
    // 5. Locking (Concurrency Control)
    const lockKey = `${sectorId}:${start.toFormat("yyyy-MM-dd'T'HH:mm")}`;
    const previous = slotLocks.get(lockKey) || Promise.resolve();
    const myExecution = previous
        .catch(() => { })
        .then(() => {
        // Create the interval for the NEW reservation
        const newReservationInterval = Interval.fromDateTimes(start, end);
        // Check availability again strictly inside the lock
        const availableTable = suitableTables.find(table => {
            const isOccupied = reservations.some(res => {
                // Only check CONFIRMED reservations
                if (res.status !== 'CONFIRMED')
                    return false;
                // Filter by restaurantId AND sectorId
                if (res.restaurantId !== restaurantId || res.sectorId !== sectorId)
                    return false;
                // Check if this table is in this reservation
                if (!res.tableIds.includes(table.id))
                    return false;
                // Time overlap check
                const existingReservationInterval = createInterval(res.startDateTimeISO, res.endDateTimeISO, restaurant.timezone);
                // Check for overlap
                return newReservationInterval.overlaps(existingReservationInterval);
            });
            return !isOccupied;
        });
        if (!availableTable) {
            throw { status: 409, message: 'no_capacity' };
        }
        // Create Reservation
        const now = DateTime.now().toISO();
        const reservation = {
            id: uuidv4(),
            restaurantId,
            sectorId,
            tableIds: [availableTable.id],
            partySize,
            startDateTimeISO: start.toISO(),
            endDateTimeISO: end.toISO(),
            status: 'CONFIRMED',
            customer,
            notes,
            createdAt: now,
            updatedAt: now,
        };
        reservations.push(reservation);
        idempotencyStore.set(idempotencyKey, reservation);
        return reservation;
    });
    slotLocks.set(lockKey, myExecution);
    return myExecution;
}
