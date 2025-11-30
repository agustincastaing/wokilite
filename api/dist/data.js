import { DateTime } from 'luxon';
export const restaurants = [];
export const sectors = [];
export const tables = [];
export const reservations = [];
export function seedData() {
    const now = DateTime.now().toISO();
    restaurants.push({
        id: 'R1',
        name: 'Bistro Central',
        timezone: 'America/Argentina/Buenos_Aires',
        shifts: [
            { start: '12:00', end: '16:00' },
            { start: '20:00', end: '23:45' }
        ],
        createdAt: now,
        updatedAt: now
    });
    sectors.push({ id: 'S1', restaurantId: 'R1', name: 'Main Hall', createdAt: now, updatedAt: now }, { id: 'S2', restaurantId: 'R1', name: 'Terrace', createdAt: now, updatedAt: now });
    tables.push({ id: 'T1', sectorId: 'S1', name: 'Table 1', minSize: 2, maxSize: 2, createdAt: now, updatedAt: now }, { id: 'T2', sectorId: 'S1', name: 'Table 2', minSize: 2, maxSize: 4, createdAt: now, updatedAt: now }, { id: 'T3', sectorId: 'S1', name: 'Table 3', minSize: 2, maxSize: 4, createdAt: now, updatedAt: now }, { id: 'T4', sectorId: 'S1', name: 'Table 4', minSize: 4, maxSize: 6, createdAt: now, updatedAt: now }, { id: 'T5', sectorId: 'S2', name: 'Table 5', minSize: 2, maxSize: 2, createdAt: now, updatedAt: now });
}
