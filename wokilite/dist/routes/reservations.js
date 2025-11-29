"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/reservations.ts
const express_1 = require("express");
const zod_1 = require("zod");
const reservation_1 = require("../services/reservation");
const luxon_1 = require("luxon");
const data_1 = require("../data");
const router = (0, express_1.Router)();
const iso = (dt) => dt.toISO({ suppressMilliseconds: true, includeOffset: true });
const createBodySchema = zod_1.z.object({
    restaurantId: zod_1.z.string(),
    sectorId: zod_1.z.string(),
    partySize: zod_1.z.number().int().min(1),
    startDateTimeISO: zod_1.z.string(),
    customer: zod_1.z.object({
        name: zod_1.z.string().min(1),
        phone: zod_1.z.string().min(1),
        email: zod_1.z.string().email(),
    }),
    notes: zod_1.z.string().optional(),
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
            createdAt: iso(luxon_1.DateTime.now()),
            updatedAt: iso(luxon_1.DateTime.now()),
        };
        const reservation = await (0, reservation_1.createReservation)(restaurantId, sectorId, partySize, startDateTimeISO, fullCustomer, notes, idempotencyKey);
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
    const index = data_1.reservations.findIndex(r => r.id === id && r.status === 'CONFIRMED');
    if (index === -1) {
        return res.status(404).json({ error: 'reservation_not_found_or_already_cancelled' });
    }
    data_1.reservations[index] = {
        ...data_1.reservations[index],
        status: 'CANCELLED',
        updatedAt: iso(luxon_1.DateTime.now()),
    };
    return res.status(204).send();
});
router.get('/day', (req, res) => {
    const { restaurantId, date, sectorId } = req.query;
    if (!restaurantId || !date || typeof restaurantId !== 'string' || typeof date !== 'string') {
        return res.status(400).json({ error: 'missing restaurantId or date' });
    }
    const dayStart = luxon_1.DateTime.fromISO(`${date}T00:00:00`, { zone: 'America/Argentina/Buenos_Aires' });
    const dayEnd = dayStart.plus({ days: 1 });
    const dayReservations = data_1.reservations.filter(r => {
        if (r.restaurantId !== restaurantId)
            return false;
        if (r.status !== 'CONFIRMED')
            return false;
        const start = luxon_1.DateTime.fromISO(r.startDateTimeISO);
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
exports.default = router;
