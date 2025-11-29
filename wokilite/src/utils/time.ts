// src/utils/datetime.ts
import { DateTime, Interval } from 'luxon';

export function normalizeISO(isoString: string): string {
  const dt = DateTime.fromISO(isoString);
  if (!dt.isValid) throw new Error(`Invalid ISO datetime: ${isoString}`);
  return dt.toISO()!;
}

export function isoEquals(iso1: string, iso2: string): boolean {
  try {
    return normalizeISO(iso1) === normalizeISO(iso2);
  } catch {
    return false;
  }
}

export function parseInTimezone(isoString: string, timezone: string): DateTime {
  const dt = DateTime.fromISO(isoString).setZone(timezone);
  if (!dt.isValid) throw new Error(`Invalid ISO datetime or timezone: ${isoString}, ${timezone}`);
  return dt;
}

export function createInterval(startISO: string, endISO: string, timezone: string) {
    const start = parseInTimezone(startISO, timezone);
    const end = parseInTimezone(endISO, timezone);
    return Interval.fromDateTimes(start, end);
  }