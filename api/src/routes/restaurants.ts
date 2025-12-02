import { Router, Request, Response } from 'express';
import { restaurantRepository, sectorRepository, tableRepository } from '../repositories';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const restaurants = await restaurantRepository.findAll();

    if (!restaurants || restaurants.length === 0) {
      return res.status(404).json({ error: 'not_found', detail: 'No restaurants found' });
    }

    const restaurantsWithSectors = await Promise.all(
      restaurants.map(async r => {
        const sectors = await sectorRepository.findByRestaurantId(r.id);
        const sectorsWithCapacity = await Promise.all(
          sectors.map(async sector => {
            const tables = await tableRepository.findBySectorId(sector.id);
            return {
              ...sector,
              maxCapacity: tables.length > 0 
                ? Math.max(...tables.map(t => t.maxSize)) 
                : 0,
            };
          })
        );
        return {
          ...r,
          sectors: sectorsWithCapacity,
        };
      })
    );

    return res.status(200).json({ restaurants: restaurantsWithSectors });
  } catch (err: any) {
    console.error('Error fetching restaurants:', err);
    return res.status(500).json({ error: 'internal_error', detail: err.message });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const restaurant = await restaurantRepository.findById(id);
    if (!restaurant) {
      return res.status(404).json({ error: 'not_found', detail: `Restaurant ${id} not found` });
    }

    const restaurantSectors = await sectorRepository.findByRestaurantId(id);

    const sectorsWithTables = await Promise.all(
      restaurantSectors.map(async sector => {
        const tables = await tableRepository.findBySectorId(sector.id);
        return {
          ...sector,
          tables,
        };
      })
    );

    return res.json({
      ...restaurant,
      sectors: sectorsWithTables,
    });
  } catch (err: any) {
    console.error('Error fetching restaurant:', err);
    return res.status(500).json({ error: 'internal_error' });
  }
});

export default router;