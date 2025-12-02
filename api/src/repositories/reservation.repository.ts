import { prisma } from '../db/client';
import type { Reservation, Customer, CreateCustomer } from '../models';

export const reservationRepository = {
  /**
   * Find reservation by idempotency key
   */
  async findByIdempotencyKey(key: string): Promise<Reservation | null> {
    const r = await prisma.reservation.findUnique({
      where: { idempotencyKey: key },
      include: {
        customer: true,
        tables: {
          include: { table: true },
        },
      },
    });

    if (!r) return null;

    return {
      id: r.id,
      restaurantId: r.restaurantId,
      sectorId: r.sectorId,
      tableIds: r.tables.map((t: any) => t.tableId),
      partySize: r.partySize,
      startDateTimeISO: r.startDateTimeISO,
      endDateTimeISO: r.endDateTimeISO,
      status: r.status as 'CONFIRMED' | 'PENDING' | 'CANCELLED',
      customer: {
          name: r.customer.name,
          phone: r.customer.phone,
          email: r.customer.email,
          createdAt: r.customer.createdAt.toISOString(),
          updatedAt: r.customer.updatedAt.toISOString()
      },
      notes: r.notes ?? undefined,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    };
  },

  /**
   * Get a reservation by ID
   */
  async findById(id: string): Promise<Reservation | null> {
    const r = await prisma.reservation.findUnique({
      where: { id },
      include: {
        customer: true,
        tables: true,
      },
    });

    if (!r) return null;

    return {
      id: r.id,
      restaurantId: r.restaurantId,
      sectorId: r.sectorId,
      tableIds: r.tables.map((t: any) => t.tableId),
      partySize: r.partySize,
      startDateTimeISO: r.startDateTimeISO,
      endDateTimeISO: r.endDateTimeISO,
      status: r.status as 'CONFIRMED' | 'PENDING' | 'CANCELLED',
      customer: {
          name: r.customer.name,
          phone: r.customer.phone,
          email: r.customer.email,
          createdAt: r.customer.createdAt.toISOString(),
          updatedAt: r.customer.updatedAt.toISOString()
      },
      notes: r.notes ?? undefined,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    };
  },

  /**
   * Get all confirmed reservations for a restaurant/sector
   */
  async findConfirmedByRestaurantAndSector(
    restaurantId: string,
    sectorId: string
  ): Promise<Reservation[]> {
    const reservations = await prisma.reservation.findMany({
      where: {
        restaurantId,
        sectorId,
        status: 'CONFIRMED',
      },
      include: {
        customer: true,
        tables: true,
      },
      orderBy: { startDateTimeISO: 'asc' },
    });

    return reservations.map((r: any) => ({
      id: r.id,
      restaurantId: r.restaurantId,
      sectorId: r.sectorId,
      tableIds: r.tables.map((t: any) => t.tableId),
      partySize: r.partySize,
      startDateTimeISO: r.startDateTimeISO,
      endDateTimeISO: r.endDateTimeISO,
      status: r.status as 'CONFIRMED' | 'PENDING' | 'CANCELLED',
      customer: {
        name: r.customer.name,
        phone: r.customer.phone,
        email: r.customer.email,
        createdAt: r.customer.createdAt.toISOString(),
        updatedAt: r.customer.updatedAt.toISOString()
      },
      notes: r.notes ?? undefined,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }));
  },

  /**
   * Get reservations for a specific day
   */
  async findByDay(
    restaurantId: string,
    datePrefix: string, // YYYY-MM-DD
    sectorId?: string
  ): Promise<Reservation[]> {
    const reservations = await prisma.reservation.findMany({
      where: {
        restaurantId,
        ...(sectorId && { sectorId }),
        startDateTimeISO: {
          startsWith: datePrefix,
        },
      },
      include: {
        customer: true,
        tables: true,
      },
      orderBy: { startDateTimeISO: 'asc' },
    });

    return reservations.map((r: any) => ({
      id: r.id,
      restaurantId: r.restaurantId,
      sectorId: r.sectorId,
      tableIds: r.tables.map((t: any) => t.tableId),
      partySize: r.partySize,
      startDateTimeISO: r.startDateTimeISO,
      endDateTimeISO: r.endDateTimeISO,
      status: r.status as 'CONFIRMED' | 'PENDING' | 'CANCELLED',
      customer: {
        name: r.customer.name,
        phone: r.customer.phone,
        email: r.customer.email,
        createdAt: r.customer.createdAt.toISOString(),
        updatedAt: r.customer.updatedAt.toISOString()
      },
      notes: r.notes ?? undefined,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }));
  },

  /**
   * Check for duplicate reservation (same customer, same time, same restaurant/sector)
   */
  async findDuplicate(
    restaurantId: string,
    sectorId: string,
    startDateTimeISO: string,
    customerEmail: string,
    customerPhone: string
  ): Promise<Reservation | null> {
    const r = await prisma.reservation.findFirst({
      where: {
        restaurantId,
        sectorId,
        startDateTimeISO,
        status: 'CONFIRMED',
        customer: {
          OR: [
            { email: customerEmail },
            { phone: customerPhone },
          ],
        },
      },
      include: {
        customer: true,
        tables: true,
      },
    });

    if (!r) return null;

    return {
      id: r.id,
      restaurantId: r.restaurantId,
      sectorId: r.sectorId,
      tableIds: r.tables.map((t: any) => t.tableId),
      partySize: r.partySize,
      startDateTimeISO: r.startDateTimeISO,
      endDateTimeISO: r.endDateTimeISO,
      status: r.status as 'CONFIRMED' | 'PENDING' | 'CANCELLED',
      customer: {
          name: r.customer.name,
          phone: r.customer.phone,
          email: r.customer.email,
          createdAt: r.customer.createdAt.toISOString(),
          updatedAt: r.customer.updatedAt.toISOString()
      },
      notes: r.notes ?? undefined,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    };
  },

  /**
   * Create a new reservation
   */
  async create(data: {
    restaurantId: string;
    sectorId: string;
    tableIds: string[];
    partySize: number;
    startDateTimeISO: string;
    endDateTimeISO: string;
    customer: CreateCustomer;
    notes?: string;
    idempotencyKey?: string;
    status?: 'CONFIRMED' | 'PENDING' | 'CANCELLED';
  }): Promise<Reservation> {
    // First, find or create customer
    let customer = await prisma.customer.findFirst({
      where: {
        email: data.customer.email,
        phone: data.customer.phone,
      },
    });

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          name: data.customer.name,
          phone: data.customer.phone,
          email: data.customer.email,
        },
      });
    } else {
      // Update customer name if changed
      if (customer.name !== data.customer.name) {
        customer = await prisma.customer.update({
          where: { id: customer.id },
          data: { name: data.customer.name },
        });
      }
    }

    // Create reservation with table associations
    const r = await prisma.reservation.create({
      data: {
        restaurantId: data.restaurantId,
        sectorId: data.sectorId,
        customerId: customer.id,
        partySize: data.partySize,
        startDateTimeISO: data.startDateTimeISO,
        endDateTimeISO: data.endDateTimeISO,
        status: data.status ?? 'CONFIRMED',
        notes: data.notes,
        idempotencyKey: data.idempotencyKey,
        tables: {
          create: data.tableIds.map(tableId => ({
            tableId,
          })),
        },
      },
      include: {
        customer: true,
        tables: true,
      },
    });

    return {
      id: r.id,
      restaurantId: r.restaurantId,
      sectorId: r.sectorId,
      tableIds: r.tables.map((t: any) => t.tableId),
      partySize: r.partySize,
      startDateTimeISO: r.startDateTimeISO,
      endDateTimeISO: r.endDateTimeISO,
      status: r.status as 'CONFIRMED' | 'PENDING' | 'CANCELLED',
      customer: {
          name: r.customer.name,
          phone: r.customer.phone,
          email: r.customer.email,
          createdAt: r.customer.createdAt.toISOString(),
          updatedAt: r.customer.updatedAt.toISOString()
      },
      notes: r.notes ?? undefined,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    };
  },

  /**
   * Update reservation status
   */
  async updateStatus(
    id: string,
    status: 'CONFIRMED' | 'PENDING' | 'CANCELLED'
  ): Promise<Reservation | null> {
    const r = await prisma.reservation.update({
      where: { id },
      data: { status },
      include: {
        customer: true,
        tables: true,
      },
    });

    return {
      id: r.id,
      restaurantId: r.restaurantId,
      sectorId: r.sectorId,
      tableIds: r.tables.map((t: any) => t.tableId),
      partySize: r.partySize,
      startDateTimeISO: r.startDateTimeISO,
      endDateTimeISO: r.endDateTimeISO,
      status: r.status as 'CONFIRMED' | 'PENDING' | 'CANCELLED',
      customer: {
          name: r.customer.name,
          phone: r.customer.phone,
          email: r.customer.email,
          createdAt: r.customer.createdAt.toISOString(),
          updatedAt: r.customer.updatedAt.toISOString()
      },
      notes: r.notes ?? undefined,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    };
  },

  /**
   * Delete idempotency key (to allow rebooking)
   */
  async clearIdempotencyKey(reservationId: string): Promise<void> {
    await prisma.reservation.update({
      where: { id: reservationId },
      data: { idempotencyKey: null },
    });
  },

  /**
   * Delete a reservation
   */
  async delete(id: string): Promise<void> {
    await prisma.reservation.delete({
      where: { id },
    });
  },
};

export default reservationRepository;