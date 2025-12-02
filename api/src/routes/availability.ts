import { Router, Request, Response } from 'express';
import { getAvailability, getPotentialSlots, getRestaurant } from '../services/availability';
import { z } from 'zod';
import { DateTime, Interval } from 'luxon';
import { sectorRepository, tableRepository, reservationRepository } from '../repositories';

const router = Router();

const querySchema = z.object({
  restaurantId: z.string(),
  sectorId: z.string(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  partySize: z.coerce.number().int().min(1),
});

interface FloorPlanTable {
  id: string;
  name: string;
  minSize: number;
  maxSize: number;
  isOccupied: boolean;
  currentReservation?: {
    customerName: string;
    time: string;
    partySize: number;
  };
  slots?: any[];
}

router.get('/', async (req: Request, res: Response) => {
  const parseResult = querySchema.safeParse(req.query);
  if (!parseResult.success) {
    return res.status(400).json({ error: 'invalid_params' });
  }

  const { restaurantId, sectorId, date, partySize } = parseResult.data;

  try {
    const slots = await getAvailability(restaurantId, sectorId, date, partySize);

    return res.json({
      slotMinutes: 15,
      durationMinutes: 90,
      slots,
    });
  } catch (err: any) {
    if (err.status === 404 || err.message?.includes('not found')) {
      return res.status(404).json({ error: 'not_found', detail: err.message });
    }
    return res.status(500).json({ error: 'internal_error' });
  }
});

router.get('/floor-plan', async (req: Request, res: Response) => {
  const { restaurantId, sectorId, dateTime, time } = req.query;

  try {
    if (!restaurantId || !sectorId) {
      return res.status(400).json({
        error: 'invalid_params',
        detail: 'restaurantId and sectorId are required',
      });
    }

    const restaurant = await getRestaurant(restaurantId as string);

    const sector = await sectorRepository.findById(sectorId as string);
    if (!sector || sector.restaurantId !== restaurantId) {
      return res.status(404).json({ error: 'sector_not_found' });
    }

    const sectorTables = await tableRepository.findBySectorId(sectorId as string);

    let referenceTime: DateTime;
    let slots: DateTime[] = [];

    if (time && typeof time === 'string') {
      referenceTime = DateTime.fromISO(time).setZone(restaurant.timezone);
      if (!referenceTime.isValid) {
        return res.status(400).json({ error: 'invalid_datetime' });
      }
    } else {
      referenceTime = DateTime.now().setZone(restaurant.timezone);
    }

    // Get potential slots for the date
    const dateStr = dateTime && typeof dateTime === 'string' 
      ? dateTime 
      : referenceTime.toISODate()!;
    slots = getPotentialSlots(dateStr, restaurant);

    // Calculate the 15-minute slot interval
    const slotStart = referenceTime;
    const slotEnd = referenceTime.plus({ minutes: 15 });
    const slotInterval = Interval.fromDateTimes(slotStart, slotEnd);

    // Get confirmed reservations for this restaurant/sector
    const reservations = await reservationRepository.findConfirmedByRestaurantAndSector(
      restaurantId as string,
      sectorId as string
    );

    const activeReservationsInSlot = reservations.filter(res => {
      if (res.status !== 'CONFIRMED') return false;

      const resStart = DateTime.fromISO(res.startDateTimeISO).setZone(restaurant.timezone);
      const resEnd = DateTime.fromISO(res.endDateTimeISO).setZone(restaurant.timezone);
      const reservationInterval = Interval.fromDateTimes(resStart, resEnd);

      return slotInterval.overlaps(reservationInterval);
    });

    const floorPlanTables: FloorPlanTable[] = sectorTables.map(table => {
      // Find reservation for this specific table
      const activeReservation = activeReservationsInSlot.find(res =>
        res.tableIds.includes(table.id)
      );

      const floorPlanTable: FloorPlanTable = {
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
      slots: slots.map(s => s.toISO()),
    });
  } catch (err: any) {
    console.error('Error fetching floor plan:', err);
    if (err.status === 404) {
      return res.status(404).json({ error: 'not_found', detail: err.message });
    }
    return res.status(500).json({
      error: 'internal_error',
      detail: err.message,
    });
  }
});

export default router;