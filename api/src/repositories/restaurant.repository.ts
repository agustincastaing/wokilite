import { prisma } from '../db/client';
import type { Restaurant } from '../models';

export const restaurantRepository = {
  /**
   * Get all restaurants with their sectors and tables
   */
  async findAll(): Promise<Restaurant[]> {
    const restaurants = await prisma.restaurant.findMany({
      include: {
        sectors: {
          include: {
            tables: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return restaurants.map((r: any) => ({
      id: r.id,
      name: r.name,
      timezone: r.timezone,
      shifts: r.shifts ? JSON.parse(r.shifts) : undefined,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }));
  },

  /**
   * Get a restaurant by ID
   */
  async findById(id: string): Promise<Restaurant | null> {
    const r = await prisma.restaurant.findUnique({
      where: { id },
    });

    if (!r) return null;

    return {
      id: r.id,
      name: r.name,
      timezone: r.timezone,
      shifts: r.shifts ? JSON.parse(r.shifts) : undefined,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    };
  },

  /**
   * Create a new restaurant
   */
  async create(data: {
    name: string;
    timezone?: string;
    shifts?: Array<{ start: string; end: string }>;
  }): Promise<Restaurant> {
    const r = await prisma.restaurant.create({
      data: {
        name: data.name,
        timezone: data.timezone ?? 'America/New_York',
        shifts: data.shifts ? JSON.stringify(data.shifts) : null,
      },
    });

    return {
      id: r.id,
      name: r.name,
      timezone: r.timezone,
      shifts: r.shifts ? JSON.parse(r.shifts) : undefined,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    };
  },

  /**
   * Update a restaurant
   */
  async update(
    id: string,
    data: Partial<{
      name: string;
      timezone: string;
      shifts: Array<{ start: string; end: string }>;
    }>
  ): Promise<Restaurant> {
    const r = await prisma.restaurant.update({
      where: { id },
      data: {
        ...data,
        shifts: data.shifts ? JSON.stringify(data.shifts) : undefined,
      },
    });

    return {
      id: r.id,
      name: r.name,
      timezone: r.timezone,
      shifts: r.shifts ? JSON.parse(r.shifts) : undefined,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    };
  },

  /**
   * Delete a restaurant
   */
  async delete(id: string): Promise<void> {
    await prisma.restaurant.delete({
      where: { id },
    });
  },
};

export default restaurantRepository;