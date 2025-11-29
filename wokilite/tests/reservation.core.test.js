"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// tests/reservation.core.test.ts
const vitest_1 = require("vitest");
const supertest_1 = __importDefault(require("supertest"));
const server_1 = require("../src/server");
const data_1 = require("../src/data");
const luxon_1 = require("luxon");
const time_1 = require("../src/utils/time");
(0, vitest_1.beforeEach)(() => {
    data_1.reservations.length = 0;
});
const validPayload = {
    restaurantId: 'R1',
    sectorId: 'S1',
    partySize: 6,
    startDateTimeISO: '2025-09-08T20:00:00-03:00',
    customer: {
        name: 'Test User',
        phone: '+1234567890',
        email: 'test@example.com',
    },
};
(0, vitest_1.describe)('WokiLite CORE – Minimal Test Cases', () => {
    (0, vitest_1.it)('1. Happy path: create → 201 + assigned table becomes unavailable', async () => {
        const validPayload = {
            restaurantId: 'R1',
            sectorId: 'S1',
            partySize: 6,
            startDateTimeISO: '2025-09-08T20:00:00-03:00',
            customer: { name: "Test", phone: "123", email: "test@test.com" }
        };
        // 1. Create Reservation
        const createRes = await (0, supertest_1.default)(server_1.app)
            .post('/reservations')
            .set('Idempotency-Key', 'happy-1')
            .send(validPayload)
            .expect(201);
        // CAPTURE what the system actually assigned (T4)
        const assignedTableIds = createRes.body.tableIds;
        (0, vitest_1.expect)(assignedTableIds.length).toBeGreaterThan(0);
        const assignedTableId = assignedTableIds[0];
        // 2. Check Availability
        const avail = await (0, supertest_1.default)(server_1.app)
            .get('/availability')
            .query({
            restaurantId: 'R1',
            sectorId: 'S1',
            date: '2025-09-08',
            partySize: 6,
        })
            .expect(200);
        // Find the exact time slot
        const expectedStartMillis = luxon_1.DateTime.fromISO(validPayload.startDateTimeISO).toMillis();
        const slot = avail.body.slots.find((s) => luxon_1.DateTime.fromISO(s.start).toMillis() === expectedStartMillis);
        // We must assert that a slot was actually found before accessing its properties.
        (0, vitest_1.expect)(slot).toBeDefined();
        // 3. Assertion
        // We expect the slot to be valid, BUT the specific table we just booked must be gone.
        if (slot.available) {
            (0, vitest_1.expect)(slot.tables).not.toContain(assignedTableId);
        }
        else {
            // If that was the ONLY table, the whole slot becomes unavailable
            (0, vitest_1.expect)(slot.reason).toBe('no_capacity');
        }
    });
    (0, vitest_1.it)('2. Concurrency: two simultaneous creates → one 201, one 409', async () => {
        const [res1, res2] = await Promise.all([
            (0, supertest_1.default)(server_1.app).post('/reservations').set('Idempotency-Key', 'conc-1').send(validPayload),
            (0, supertest_1.default)(server_1.app).post('/reservations').set('Idempotency-Key', 'conc-2').send(validPayload),
        ]);
        const success = [res1, res2].filter(r => r.status === 201);
        const conflict = [res1, res2].filter(r => r.status === 409);
        (0, vitest_1.expect)(success.length).toBe(1);
        (0, vitest_1.expect)(conflict.length).toBe(1);
        (0, vitest_1.expect)(conflict[0].body.error).toBe('no_capacity');
    });
    (0, vitest_1.it)('3. Boundary: adjacent reservations (end-exclusive) do not collide', async () => {
        // First reservation: 20:00 → 21:30
        await (0, supertest_1.default)(server_1.app).post('/reservations').set('Idempotency-Key', 'adj-1').send(validPayload).expect(201);
        // Second reservation starts exactly when first ends: 21:30
        const adjacentPayload = {
            ...validPayload,
            startDateTimeISO: luxon_1.DateTime.fromISO(validPayload.startDateTimeISO).plus({ minutes: 90 }).toISO(),
        };
        await (0, supertest_1.default)(server_1.app)
            .post('/reservations')
            .set('Idempotency-Key', 'adj-2')
            .send(adjacentPayload)
            .expect(201);
    });
    (0, vitest_1.it)('4. Shifts: attempt outside shift → 422', async () => {
        const restaurantRes = await (0, supertest_1.default)(server_1.app)
            .get('/restaurants/R1')
            .expect(200);
        const restaurant = restaurantRes.body;
        (0, vitest_1.expect)(restaurant.shifts).toBeDefined();
        (0, vitest_1.expect)(restaurant.shifts.length).toBeGreaterThan(0);
        const firstShift = restaurant.shifts[0];
        const shiftStart = firstShift.start;
        const [shiftHour, shiftMin] = shiftStart.split(':').map(Number);
        const beforeShiftHour = (shiftHour - 1 + 24) % 24; // Handle wrap-around
        const outsideTime = `${String(beforeShiftHour).padStart(2, '0')}:${String(shiftMin).padStart(2, '0')}`;
        const outsidePayload = {
            ...validPayload,
            startDateTimeISO: `2025-09-08T${outsideTime}:00-03:00`,
        };
        const res = await (0, supertest_1.default)(server_1.app)
            .post('/reservations')
            .set('Idempotency-Key', 'shift-test')
            .send(outsidePayload)
            .expect(422);
        (0, vitest_1.expect)(res.body.error).toBe('outside_service_window');
    });
    (0, vitest_1.it)('5. Idempotency: same Idempotency-Key returns same reservation', async () => {
        const key = 'idempotent-xyz';
        const res1 = await (0, supertest_1.default)(server_1.app)
            .post('/reservations')
            .set('Idempotency-Key', key)
            .send(validPayload)
            .expect(201);
        const res2 = await (0, supertest_1.default)(server_1.app)
            .post('/reservations')
            .set('Idempotency-Key', key)
            .send(validPayload)
            .expect(201);
        (0, vitest_1.expect)(res1.body.id).toBe(res2.body.id);
        (0, vitest_1.expect)(res1.body.createdAt).toBe(res2.body.createdAt);
    });
    (0, vitest_1.it)('6. Cancel: DELETE → 204 + slot becomes available again', async () => {
        const createRes = await (0, supertest_1.default)(server_1.app)
            .post('/reservations')
            .set('Idempotency-Key', 'cancel-test')
            .send(validPayload)
            .expect(201);
        await (0, supertest_1.default)(server_1.app).delete(`/reservations/${createRes.body.id}`).expect(204);
        // Slot should be available again
        const avail = await (0, supertest_1.default)(server_1.app)
            .get('/availability')
            .query({
            restaurantId: validPayload.restaurantId,
            sectorId: validPayload.sectorId,
            date: '2025-09-08',
            partySize: validPayload.partySize,
        })
            .expect(200);
        const slot = avail.body.slots.find((s) => (0, time_1.isoEquals)(s.start, validPayload.startDateTimeISO));
        (0, vitest_1.expect)(slot.available).toBe(true);
    });
    (0, vitest_1.it)('7. Daily listing: with and without sectorId', async () => {
        await (0, supertest_1.default)(server_1.app).post('/reservations').set('Idempotency-Key', 'list-1').send(validPayload).expect(201);
        const withSector = await (0, supertest_1.default)(server_1.app)
            .get('/reservations/day')
            .query({ restaurantId: 'R1', date: '2025-09-08', sectorId: 'S1' })
            .expect(200);
        (0, vitest_1.expect)(withSector.body.items.length).toBe(1);
        const allSectors = await (0, supertest_1.default)(server_1.app)
            .get('/reservations/day')
            .query({ restaurantId: 'R1', date: '2025-09-08' })
            .expect(200);
        (0, vitest_1.expect)(allSectors.body.items.length).toBeGreaterThanOrEqual(1);
    });
    (0, vitest_1.it)('8. Timestamps: createdAt/updatedAt on create and cancel', async () => {
        const createRes = await (0, supertest_1.default)(server_1.app)
            .post('/reservations')
            .set('Idempotency-Key', 'ts-test')
            .send(validPayload)
            .expect(201);
        const createdAt = createRes.body.createdAt;
        const updatedAt = createRes.body.updatedAt;
        (0, vitest_1.expect)(createdAt).toBeTruthy();
        (0, vitest_1.expect)(updatedAt).toBeTruthy();
        (0, vitest_1.expect)(createdAt).toBe(updatedAt);
        // Cancel → updatedAt changes
        await (0, supertest_1.default)(server_1.app).delete(`/reservations/${createRes.body.id}`).expect(204);
        const listRes = await (0, supertest_1.default)(server_1.app)
            .get('/reservations/day')
            .query({ restaurantId: 'R1', date: '2025-09-08' })
            .expect(200);
        const cancelled = listRes.body.items.find((r) => r.id === createRes.body.id);
        (0, vitest_1.expect)(cancelled.status).toBe('CANCELLED');
        (0, vitest_1.expect)(cancelled.updatedAt > updatedAt).toBe(true);
    });
});
