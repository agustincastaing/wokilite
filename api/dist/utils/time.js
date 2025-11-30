// src/utils/datetime.ts
import { DateTime, Interval } from 'luxon';
export function normalizeISO(isoString) {
    const dt = DateTime.fromISO(isoString);
    if (!dt.isValid)
        throw new Error(`Invalid ISO datetime: ${isoString}`);
    return dt.toISO();
}
export function isoEquals(iso1, iso2) {
    try {
        return normalizeISO(iso1) === normalizeISO(iso2);
    }
    catch {
        return false;
    }
}
export function parseInTimezone(isoString, timezone) {
    const dt = DateTime.fromISO(isoString).setZone(timezone);
    if (!dt.isValid)
        throw new Error(`Invalid ISO datetime or timezone: ${isoString}, ${timezone}`);
    return dt;
}
export function createInterval(startISO, endISO, timezone) {
    const start = parseInTimezone(startISO, timezone);
    const end = parseInTimezone(endISO, timezone);
    return Interval.fromDateTimes(start, end);
}
