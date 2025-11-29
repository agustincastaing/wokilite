"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeISO = normalizeISO;
exports.isoEquals = isoEquals;
exports.parseInTimezone = parseInTimezone;
exports.createInterval = createInterval;
// src/utils/datetime.ts
const luxon_1 = require("luxon");
function normalizeISO(isoString) {
    const dt = luxon_1.DateTime.fromISO(isoString);
    if (!dt.isValid)
        throw new Error(`Invalid ISO datetime: ${isoString}`);
    return dt.toISO();
}
function isoEquals(iso1, iso2) {
    try {
        return normalizeISO(iso1) === normalizeISO(iso2);
    }
    catch {
        return false;
    }
}
function parseInTimezone(isoString, timezone) {
    const dt = luxon_1.DateTime.fromISO(isoString).setZone(timezone);
    if (!dt.isValid)
        throw new Error(`Invalid ISO datetime or timezone: ${isoString}, ${timezone}`);
    return dt;
}
function createInterval(startISO, endISO, timezone) {
    const start = parseInTimezone(startISO, timezone);
    const end = parseInTimezone(endISO, timezone);
    return luxon_1.Interval.fromDateTimes(start, end);
}
