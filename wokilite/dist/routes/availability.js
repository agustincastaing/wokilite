"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const availability_1 = require("../services/availability");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
const querySchema = zod_1.z.object({
    restaurantId: zod_1.z.string(),
    sectorId: zod_1.z.string(),
    date: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    partySize: zod_1.z.coerce.number().int().min(1),
});
router.get('/', (req, res) => {
    const parseResult = querySchema.safeParse(req.query);
    if (!parseResult.success) {
        return res.status(400).json({ error: 'invalid_params' });
    }
    const { restaurantId, sectorId, date, partySize } = parseResult.data;
    try {
        const slots = (0, availability_1.getAvailability)(restaurantId, sectorId, date, partySize);
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
exports.default = router;
