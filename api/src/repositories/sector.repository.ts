import { prisma } from '../db/client';
import type { Sector } from '../models';

export const sectorRepository = {
  /**
   * Get all sectors
   */
  async findAll(): Promise<Sector[]> {
    const sectors = await prisma.sector.findMany({
      orderBy: { name: 'asc' },
    });

    return sectors.map((s: any) => ({
      id: s.id,
      restaurantId: s.restaurantId,
      name: s.name,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    }));
  },

  /**
   * Get all sectors for a restaurant
   */
  async findByRestaurantId(restaurantId: string): Promise<Sector[]> {
    const sectors = await prisma.sector.findMany({
      where: { restaurantId },
      orderBy: { name: 'asc' },
    });

    return sectors.map((s: any) => ({
      id: s.id,
      restaurantId: s.restaurantId,
      name: s.name,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    }));
  },

  /**
   * Get a sector by ID
   */
  async findById(id: string): Promise<Sector | null> {
    const s = await prisma.sector.findUnique({
      where: { id },
    });

    if (!s) return null;

    return {
      id: s.id,
      restaurantId: s.restaurantId,
      name: s.name,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    };
  },

  /**
   * Create a new sector
   */
  async create(data: {
    restaurantId: string;
    name: string;
  }): Promise<Sector> {
    const s = await prisma.sector.create({
      data: {
        restaurantId: data.restaurantId,
        name: data.name,
      },
    });

    return {
      id: s.id,
      restaurantId: s.restaurantId,
      name: s.name,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    };
  },

  /**
   * Update a sector
   */
  async update(
    id: string,
    data: Partial<{ name: string }>
  ): Promise<Sector> {
    const s = await prisma.sector.update({
      where: { id },
      data,
    });

    return {
      id: s.id,
      restaurantId: s.restaurantId,
      name: s.name,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    };
  },

  /**
   * Delete a sector
   */
  async delete(id: string): Promise<void> {
    await prisma.sector.delete({
      where: { id },
    });
  },
};

export default sectorRepository;