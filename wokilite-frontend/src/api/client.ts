import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const client = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// API Functions
export const api = {
  // Restaurants
  getRestaurants: () => client.get('/restaurants'),
  getRestaurant: (id: string) => client.get(`/restaurants/${id}`),

  // Availability
  getAvailability: (restaurantId: string, sectorId: string, date: string, partySize: number) =>
    client.get('/availability', {
      params: { restaurantId, sectorId, date, partySize },
    }),

  // Reservations
  createReservation: (payload: any) =>
    client.post('/reservations', payload, {
      headers: { 'Idempotency-Key': crypto.randomUUID() },
    }),
  cancelReservation: (id: string) =>
    client.delete(`/reservations/${id}`),
  getReservationsForDay: (restaurantId: string, date: string, sectorId?: string) =>
    client.get('/reservations/day', {
      params: { restaurantId, date, ...(sectorId && { sectorId }) },
    }),
  getFloorPlan: (restaurantId: string, sectorId: string, dateTime?: string, time?: string) =>
    client.get('/availability/floor-plan', {
      params: { restaurantId, sectorId, dateTime, time },
    }),
};

export default client;