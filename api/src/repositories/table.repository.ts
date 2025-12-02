import { prisma } from '../db/client';
import type { Table } from '../models';

export const tableRepository = {
  /**
   * Get all tables
   */
  async findAll(): Promise<Table[]> {
    const tables = await prisma.table.findMany({
      orderBy: { name: 'asc' },
    });

    return tables.map((t: any) => ({
      id: t.id,
      sectorId: t.sectorId,
      name: t.name,
      minSize: t.minSize,
      maxSize: t.maxSize,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
    }));
  },

  /**
   * Get all tables for a sector
   */
  async findBySectorId(sectorId: string): Promise<Table[]> {
    const tables = await prisma.table.findMany({
      where: { sectorId },
      orderBy: { name: 'asc' },
    });

    return tables.map((t: any) => ({
      id: t.id,
      sectorId: t.sectorId,
      name: t.name,
      minSize: t.minSize,
      maxSize: t.maxSize,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
    }));
  },

  /**
   * Get a table by ID
   */
  async findById(id: string): Promise<Table | null> {
    const t = await prisma.table.findUnique({
      where: { id },
    });

    if (!t) return null;

    return {
      id: t.id,
      sectorId: t.sectorId,
      name: t.name,
      minSize: t.minSize,
      maxSize: t.maxSize,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
    };
  },

  /**
   * Get tables that fit a party size for a sector
   */
  async findBySectorAndCapacity(sectorId: string, partySize: number): Promise<Table[]> {
    const tables = await prisma.table.findMany({
      where: {
        sectorId,
        minSize: { lte: partySize },
        maxSize: { gte: partySize },
      },
      orderBy: { maxSize: 'asc' },
    });

    return tables.map((t: any) => ({
      id: t.id,
      sectorId: t.sectorId,
      name: t.name,
      minSize: t.minSize,
      maxSize: t.maxSize,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
    }));
  },

  /**
   * Create a new table
   */
  async create(data: {
    sectorId: string;
    name: string;
    minSize: number;
    maxSize: number;
  }): Promise<Table> {
    const t = await prisma.table.create({
      data: {
        sectorId: data.sectorId,
        name: data.name,
        minSize: data.minSize,
        maxSize: data.maxSize,
      },
    });

    return {
      id: t.id,
      sectorId: t.sectorId,
      name: t.name,
      minSize: t.minSize,
      maxSize: t.maxSize,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
    };
  },

  /**
   * Update a table
   */
  async update(
    id: string,
    data: Partial<{
      name: string;
      minSize: number;
      maxSize: number;
    }>
  ): Promise<Table> {
    const t = await prisma.table.update({
      where: { id },
      data,
    });

    return {
      id: t.id,
      sectorId: t.sectorId,
      name: t.name,
      minSize: t.minSize,
      maxSize: t.maxSize,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
    };
  },

  /**
   * Delete a table
   */
  async delete(id: string): Promise<void> {
    await prisma.table.delete({
      where: { id },
    });
  },
};

export default tableRepository;