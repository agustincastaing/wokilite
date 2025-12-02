import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { createReservation, deleteReservation } from '../services/reservation';
import { CreateCustomer, Customer } from '../models';
import { DateTime } from 'luxon';
import { reservationRepository, restaurantRepository } from '../repositories';

const router = Router();

const iso = (dt: DateTime) => dt.toISO({ suppressMilliseconds: true, includeOffset: true })!;

const createBodySchema = z.object({
  restaurantId: z.string(),
  sectorId: z.string(),
  partySize: z.number().int().min(1),
  startDateTimeISO: z.string(),
  customer: z.object({
    name: z.string().min(1),
    phone: z.string().min(1),
    email: z.string().email(),
  }),
  notes: z.string().optional(),
});

router.post('/', async (req: Request, res: Response) => {
  const idempotencyKey = req.headers['idempotency-key'];
  if (typeof idempotencyKey !== 'string' || idempotencyKey.trim() === '') {
    return res.status(400).json({ error: 'missing_or_invalid_idempotency_key' });
  }

  const parseResult = createBodySchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: 'invalid_params', details: parseResult.error.format() });
  }

  const { restaurantId, sectorId, partySize, startDateTimeISO, customer, notes } = parseResult.data;

  try {
    // Partial customer info as Customer (backend will fill the rest)
    const partialCustomer: CreateCustomer = {
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
    };

    const reservation = await createReservation(
      restaurantId,
      sectorId,
      partySize,
      startDateTimeISO,
      partialCustomer,
      notes,
      idempotencyKey
    );

    return res.status(201).json({
      id: reservation.id,
      restaurantId: reservation.restaurantId,
      sectorId: reservation.sectorId,
      tableIds: reservation.tableIds,
      partySize: reservation.partySize,
      start: reservation.startDateTimeISO,
      end: reservation.endDateTimeISO,
      status: reservation.status,
      customer: reservation.customer,
      createdAt: reservation.createdAt,
      updatedAt: reservation.updatedAt,
      ...(reservation.notes ? { notes: reservation.notes } : {}),
    });
  } catch (err: any) {
    if (err.status === 422) {
      return res.status(422).json({ error: err.message, detail: err.detail });
    }
    if (err.status === 409) {
      return res.status(409).json({ error: err.message, detail: err.detail });
    }
    console.error('Unexpected error creating reservation:', err);
    return res.status(500).json({ error: 'internal_error' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const reservation = await reservationRepository.findById(id);
    if (!reservation || reservation.status !== 'CONFIRMED') {
      return res.status(404).json({ error: 'reservation_not_found_or_already_cancelled' });
    }

    await deleteReservation(id);

    return res.status(204).send();
  } catch (err: any) {
    console.error('Error deleting reservation:', err);
    return res.status(500).json({ error: 'internal_error' });
  }
});

router.get('/day', async (req: Request, res: Response) => {
  const { restaurantId, date, sectorId } = req.query;

  if (!restaurantId || !date || typeof restaurantId !== 'string' || typeof date !== 'string') {
    return res.status(400).json({ error: 'missing restaurantId or date' });
  }

  try {
    // Get restaurant to use its timezone
    const restaurant = await restaurantRepository.findById(restaurantId);
    const timezone = restaurant?.timezone ?? 'America/Argentina/Buenos_Aires';

    // Fetch reservations from database
    const sectorIdStr = typeof sectorId === 'string' ? sectorId : undefined;
    const dayReservations = await reservationRepository.findByDay(restaurantId, date, sectorIdStr);

    const items = dayReservations.map(r => ({
      id: r.id,
      sectorId: r.sectorId,
      tableIds: r.tableIds,
      partySize: r.partySize,
      start: r.startDateTimeISO,
      end: r.endDateTimeISO,
      status: r.status,
      customer: r.customer,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      ...(r.notes ? { notes: r.notes } : {}),
    }));

    items.sort((a, b) => a.start.localeCompare(b.start));

    return res.json({
      date,
      items,
    });
  } catch (err: any) {
    console.error('Error fetching reservations:', err);
    return res.status(500).json({ error: 'internal_error' });
  }
});

export default router;