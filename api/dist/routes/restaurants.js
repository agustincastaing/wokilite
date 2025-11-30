import { Router } from 'express';
import { restaurants, sectors, tables } from '../data';
const router = Router();
router.get('/', (req, res) => {
    try {
        if (!restaurants || restaurants.length === 0) {
            return res.status(404).json({ error: 'not_found', detail: 'No restaurants found' });
        }
        const restaurantsWithSectors = restaurants.map(r => ({
            ...r,
            sectors: sectors
                .filter(s => s.restaurantId === r.id)
                .map(sector => ({
                ...sector,
                maxCapacity: Math.max(0, ...tables.filter(t => t.sectorId === sector.id).map(t => t.maxSize)),
            })),
        }));
        return res.status(200).json({ restaurants: restaurantsWithSectors, });
    }
    catch (err) {
        console.error('Error fetching restaurants:', err);
        return res.status(500).json({ error: 'internal_error', detail: err.message });
    }
});
router.get('/:id', (req, res) => {
    const { id } = req.params;
    try {
        const restaurant = restaurants.find(r => r.id === id);
        if (!restaurant) {
            return res.status(404).json({ error: 'not_found', detail: `Restaurant ${id} not found` });
        }
        const restaurantSectors = sectors.filter(s => s.restaurantId === id);
        const sectorsWithTables = restaurantSectors.map(sector => ({
            ...sector,
            tables: tables.filter(t => t.sectorId === sector.id)
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
export default router;
