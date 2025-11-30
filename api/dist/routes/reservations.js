// src/routes/reservations.ts
import { Router } from 'express';
import { z } from 'zod';
import { createReservation } from '../services/reservation';
import { DateTime } from 'luxon';
import { reservations } from '../data';
const router = Router();
const iso = (dt) => dt.toISO({ suppressMilliseconds: true, includeOffset: true });
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
router.post('/', async (req, res) => {
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
        const fullCustomer = {
            name: customer.name,
            phone: customer.phone,
            email: customer.email,
            createdAt: iso(DateTime.now()),
            updatedAt: iso(DateTime.now()),
        };
        const reservation = await createReservation(restaurantId, sectorId, partySize, startDateTimeISO, fullCustomer, notes, idempotencyKey);
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
    }
    catch (err) {
        if (err.status === 422) {
            return res.status(422).json({ error: 'outside_service_window', detail: err.message });
        }
        if (err.status === 409) {
            return res.status(409).json({ error: 'no_capacity', detail: err.message });
        }
        console.error('Unexpected error creating reservation:', err);
        return res.status(500).json({ error: 'internal_error' });
    }
});
router.delete('/:id', (req, res) => {
    const { id } = req.params;
    const index = reservations.findIndex(r => r.id === id && r.status === 'CONFIRMED');
    if (index === -1) {
        return res.status(404).json({ error: 'reservation_not_found_or_already_cancelled' });
    }
    reservations[index] = {
        ...reservations[index],
        status: 'CANCELLED',
        updatedAt: iso(DateTime.now()),
    };
    return res.status(204).send();
});
router.get('/day', (req, res) => {
    const { restaurantId, date, sectorId } = req.query;
    if (!restaurantId || !date || typeof restaurantId !== 'string' || typeof date !== 'string') {
        return res.status(400).json({ error: 'missing restaurantId or date' });
    }
    const dayStart = DateTime.fromISO(`${date}T00:00:00`, { zone: 'America/Argentina/Buenos_Aires' });
    const dayEnd = dayStart.plus({ days: 1 });
    const dayReservations = reservations.filter(r => {
        if (r.restaurantId !== restaurantId)
            return false;
        if (r.status !== 'CONFIRMED')
            return false;
        const start = DateTime.fromISO(r.startDateTimeISO);
        return start >= dayStart && start < dayEnd;
    });
    const filtered = sectorId
        ? dayReservations.filter(r => r.sectorId === sectorId)
        : dayReservations;
    const items = filtered.map(r => ({
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
        ...(r.notes ? { notes: r.notes } : {})
    }));
    return res.json({
        date: date,
        items
    });
});
export default router;
