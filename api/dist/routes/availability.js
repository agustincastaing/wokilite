import { Router } from 'express';
import { getAvailability, getPotentialSlots } from '../services/availability';
import { z } from 'zod';
import { reservations, restaurants, sectors, tables } from '../data';
import { DateTime, Interval } from 'luxon';
const router = Router();
const querySchema = z.object({
    restaurantId: z.string(),
    sectorId: z.string(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    partySize: z.coerce.number().int().min(1),
});
router.get('/', (req, res) => {
    const parseResult = querySchema.safeParse(req.query);
    if (!parseResult.success) {
        return res.status(400).json({ error: 'invalid_params' });
    }
    const { restaurantId, sectorId, date, partySize } = parseResult.data;
    try {
        const slots = getAvailability(restaurantId, sectorId, date, partySize);
        return res.json({
            slotMinutes: 15,
            durationMinutes: 90,
            slots
        });
    }
    catch (err) {
        if (err.message.includes('not found')) {
            return res.status(404).json({ error: 'not_found', detail: err.message });
        }
        return res.status(500).json({ error: 'internal_error' });
    }
});
router.get('/floor-plan', (req, res) => {
    const { restaurantId, sectorId, dateTime, time } = req.query;
    try {
        if (!restaurantId || !sectorId) {
            return res.status(400).json({
                error: 'invalid_params',
                detail: 'restaurantId and sectorId are required',
            });
        }
        const restaurant = restaurants.find(r => r.id === restaurantId);
        if (!restaurant) {
            return res.status(404).json({ error: 'restaurant_not_found' });
        }
        const sector = sectors.find(s => s.id === sectorId && s.restaurantId === restaurantId);
        if (!sector) {
            return res.status(404).json({ error: 'sector_not_found' });
        }
        const sectorTables = tables.filter(t => t.sectorId === sectorId);
        let referenceTime;
        let slots = [];
        if (time) {
            referenceTime = DateTime.fromISO(time).setZone(restaurant.timezone);
            if (!referenceTime.isValid) {
                return res.status(400).json({ error: 'invalid_datetime' });
            }
        }
        else {
            referenceTime = DateTime.now().setZone(restaurant.timezone);
        }
        slots = getPotentialSlots(dateTime, restaurant);
        // Calculate the 15-minute slot interval
        const slotStart = referenceTime;
        const slotEnd = referenceTime.plus({ minutes: 15 });
        const slotInterval = Interval.fromDateTimes(slotStart, slotEnd);
        const activeReservationsInSlot = reservations.filter(res => {
            if (res.status !== 'CONFIRMED')
                return false;
            if (res.restaurantId !== restaurantId)
                return false;
            const resStart = DateTime.fromISO(res.startDateTimeISO).setZone(restaurant.timezone);
            const resEnd = DateTime.fromISO(res.endDateTimeISO).setZone(restaurant.timezone);
            const reservationInterval = Interval.fromDateTimes(resStart, resEnd);
            return slotInterval.overlaps(reservationInterval);
        });
        const floorPlanTables = sectorTables.map(table => {
            // Find reservation for this specific table
            const activeReservation = activeReservationsInSlot.find(res => res.tableIds.includes(table.id));
            const floorPlanTable = {
                id: table.id,
                name: table.name,
                minSize: table.minSize,
                maxSize: table.maxSize,
                isOccupied: !!activeReservation,
            };
            if (activeReservation) {
                floorPlanTable.currentReservation = {
                    customerName: activeReservation.customer.name,
                    time: DateTime.fromISO(activeReservation.startDateTimeISO)
                        .setZone(restaurant.timezone)
                        .toFormat('HH:mm'),
                    partySize: activeReservation.partySize,
                };
            }
            return floorPlanTable;
        });
        return res.status(200).json({
            restaurantId,
            sectorId,
            sectorName: sector.name,
            referenceTime: referenceTime.toISO(),
            tables: floorPlanTables,
            slots: slots
        });
    }
    catch (err) {
        console.error('Error fetching floor plan:', err);
        return res.status(500).json({
            error: 'internal_error',
            detail: err.message,
        });
    }
});
export default router;
