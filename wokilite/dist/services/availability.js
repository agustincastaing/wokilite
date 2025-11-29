"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRestaurant = getRestaurant;
exports.getAvailability = getAvailability;
// src/services/availability.ts
const luxon_1 = require("luxon");
const data_1 = require("../data");
const time_1 = require("../utils/time");
const SLOT_MINUTES = 15;
const DURATION_MINUTES = 90;
const formatSlot = (dt) => dt.toFormat("yyyy-MM-dd'T'HH:mmxxx");
function getRestaurant(id) {
    const r = data_1.restaurants.find(r => r.id === id);
    if (!r)
        throw new Error('Restaurant not found');
    return r;
}
function getSectorTables(sectorId, restaurantId) {
    const sector = data_1.sectors.find(s => s.id === sectorId && s.restaurantId === restaurantId);
    if (!sector)
        throw new Error('Sector not found');
    const sectorTables = data_1.tables.filter(t => t.sectorId === sectorId);
    if (sectorTables.length === 0)
        throw new Error('Sector has no tables');
    return sectorTables;
}
function isSlotAllowed(startDt, restaurant) {
    if (!restaurant.shifts || restaurant.shifts.length === 0)
        return true;
    const startStr = startDt.toFormat('HH:mm');
    const endStr = startDt.plus({ minutes: DURATION_MINUTES }).toFormat('HH:mm');
    return restaurant.shifts.some(shift => {
        return startStr >= shift.start && endStr <= shift.end;
    });
}
function getPotentialSlots(date, restaurant) {
    const day = luxon_1.DateTime.fromISO(date, { zone: restaurant.timezone }).startOf('day');
    const slots = [];
    for (let i = 0; i < 96; i++) {
        const slotStart = day.plus({ minutes: i * SLOT_MINUTES });
        if (isSlotAllowed(slotStart, restaurant)) {
            slots.push(slotStart);
        }
    }
    return slots;
}
function isTableAvailable(tableId, start, restaurant) {
    const reservationEnd = start.plus({ minutes: DURATION_MINUTES });
    const newInterval = luxon_1.Interval.fromDateTimes(start, reservationEnd);
    return !data_1.reservations.some(res => {
        if (res.status !== 'CONFIRMED' || res.restaurantId !== restaurant.id)
            return false;
        if (!res.tableIds.includes(tableId))
            return false;
        const resStart = luxon_1.DateTime.fromISO(res.startDateTimeISO).setZone(restaurant.timezone);
        const resEnd = luxon_1.DateTime.fromISO(res.endDateTimeISO).setZone(restaurant.timezone);
        return newInterval.overlaps(luxon_1.Interval.fromDateTimes(resStart, resEnd));
    });
}
function getAvailability(restaurantId, sectorId, date, partySize) {
    const restaurant = data_1.restaurants.find(r => r.id === restaurantId);
    if (!restaurant)
        throw { status: 404, message: "Restaurant not found" };
    // Use restaurant timezone for the 'day' definition
    const dayStart = luxon_1.DateTime.fromISO(date).setZone(restaurant.timezone).startOf('day');
    // Get all tables in sector that fit party size
    const candidateTables = data_1.tables.filter(t => t.sectorId === sectorId &&
        t.minSize <= partySize &&
        partySize <= t.maxSize);
    const slots = [];
    // Generate 96 slots (24h * 4)
    for (let i = 0; i < 96; i++) {
        const slotStart = dayStart.plus({ minutes: i * SLOT_MINUTES });
        const slotEnd = slotStart.plus({ minutes: DURATION_MINUTES });
        const slotInterval = luxon_1.Interval.fromDateTimes(slotStart, slotEnd);
        // 1. Shift Check
        let inShift = true;
        if (restaurant.shifts && restaurant.shifts.length > 0) {
            const sStr = slotStart.toFormat('HH:mm');
            const eStr = slotEnd.toFormat('HH:mm');
            inShift = restaurant.shifts.some(shift => sStr >= shift.start && eStr <= shift.end);
        }
        if (!inShift) {
            slots.push({ start: slotStart.toISO(), available: false, reason: "closed" });
            continue;
        }
        if (candidateTables.length === 0) {
            slots.push({ start: slotStart.toISO(), available: false, reason: "no_capacity" });
            continue;
        }
        // 2. Capacity Check
        // Find tables that do NOT overlap with existing confirmed reservations
        const availableTableIds = candidateTables.filter(t => {
            const isBooked = data_1.reservations.some(res => {
                if (res.status !== 'CONFIRMED')
                    return false;
                if (res.sectorId !== sectorId || res.restaurantId !== restaurantId)
                    return false;
                // Check if this table is in this reservation
                if (!res.tableIds.includes(t.id))
                    return false;
                // Parse dates with proper timezone handling
                const resStart = luxon_1.DateTime.fromISO(res.startDateTimeISO).setZone(restaurant.timezone);
                const resEnd = luxon_1.DateTime.fromISO(res.endDateTimeISO).setZone(restaurant.timezone);
                //const resInterval = Interval.fromDateTimes(resStart, resEnd);
                const resInterval = (0, time_1.createInterval)(res.startDateTimeISO, res.endDateTimeISO, restaurant.timezone);
                // Check for overlap
                return slotInterval.overlaps(resInterval);
            });
            return !isBooked;
        }).map(t => t.id);
        slots.push({
            start: slotStart.toISO(),
            available: availableTableIds.length > 0,
            tables: availableTableIds.length > 0 ? availableTableIds : undefined,
            reason: availableTableIds.length === 0 ? 'no_capacity' : undefined
        });
    }
    return slots;
}
