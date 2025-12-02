import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seed() {
  console.log('🌱 Seeding database...');

  // Clear existing data in correct order (respecting foreign keys)
  await prisma.reservationTable.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.table.deleteMany();
  await prisma.sector.deleteMany();
  await prisma.restaurant.deleteMany();

  // Create Restaurant
  await prisma.restaurant.create({
    data: {
      id: 'R1',
      name: 'Bistro Central',
      timezone: 'America/Argentina/Buenos_Aires',
      shifts: JSON.stringify([
        { start: '12:00', end: '16:00' },
        { start: '20:00', end: '23:45' },
      ]),
    },
  });

  // Create Sectors
  await prisma.sector.createMany({
    data: [
      { id: 'S1', restaurantId: 'R1', name: 'Main Hall' },
      { id: 'S2', restaurantId: 'R1', name: 'Terrace' },
    ],
  });

  // Create Tables
  await prisma.table.createMany({
    data: [
      { id: 'T1', sectorId: 'S1', name: 'Table 1', minSize: 2, maxSize: 2 },
      { id: 'T2', sectorId: 'S1', name: 'Table 2', minSize: 2, maxSize: 4 },
      { id: 'T3', sectorId: 'S1', name: 'Table 3', minSize: 2, maxSize: 4 },
      { id: 'T4', sectorId: 'S1', name: 'Table 4', minSize: 4, maxSize: 6 },
      { id: 'T5', sectorId: 'S2', name: 'Table 5', minSize: 2, maxSize: 2 },
    ],
  });

  console.log('✅ Database seeded successfully!');
  console.log(`   - 1 restaurant (Bistro Central)`);
  console.log(`   - 2 sectors (Main Hall, Terrace)`);
  console.log(`   - 5 tables`);
}

// Run seed if called directly
async function main() {
  try {
    await seed();
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();