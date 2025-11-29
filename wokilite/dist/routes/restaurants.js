"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const data_1 = require("../data");
const router = (0, express_1.Router)();
router.get('/', (req, res) => {
    try {
        if (!data_1.restaurants || data_1.restaurants.length === 0) {
            return res.status(404).json({ error: 'not_found', detail: 'No restaurants found' });
        }
        return res.status(200).json({ restaurants: data_1.restaurants });
    }
    catch (err) {
        console.error('Error fetching restaurants:', err);
        return res.status(500).json({ error: 'internal_error', detail: err.message });
    }
});
router.get('/:id', (req, res) => {
    const { id } = req.params;
    try {
        const restaurant = data_1.restaurants.find(r => r.id === id);
        if (!restaurant) {
            return res.status(404).json({ error: 'not_found', detail: `Restaurant ${id} not found` });
        }
        const restaurantSectors = data_1.sectors.filter(s => s.restaurantId === id);
        const sectorsWithTables = restaurantSectors.map(sector => ({
            ...sector,
            tables: data_1.tables.filter(t => t.sectorId === sector.id)
        }));
        return res.json({
            ...restaurant,
            sectors: sectorsWithTables
        });
    }
    catch (err) {
        return res.status(500).json({ error: 'internal_error' });
    }
});
exports.default = router;
