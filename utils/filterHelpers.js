/**
 * Shared filter helpers used across all pages for consistent
 * period and location filtering.
 */

export const PERIOD_OPTIONS = [
  { value: "all", label: "All Time" },
  { value: "today", label: "Today" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
  { value: "quarter", label: "This Quarter" },
  { value: "year", label: "This Year" },
];

/**
 * Returns { from: Date, to: Date } for the given period key, or null for "all".
 */
export function getDateRange(period) {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (period) {
    case "today":
      return { from: startOfDay, to: new Date(startOfDay.getTime() + 86400000) };
    case "week": {
      const day = now.getDay();
      const start = new Date(startOfDay);
      start.setDate(start.getDate() - day);
      return { from: start, to: new Date() };
    }
    case "month":
      return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: new Date() };
    case "quarter": {
      const q = Math.floor(now.getMonth() / 3) * 3;
      return { from: new Date(now.getFullYear(), q, 1), to: new Date() };
    }
    case "year":
      return { from: new Date(now.getFullYear(), 0, 1), to: new Date() };
    default:
      return null;
  }
}

/**
 * Filter an array of records by the selected period.
 * @param {Array} records
 * @param {string} period  – one of PERIOD_OPTIONS values
 * @param {string} dateField – the field name that holds the date (default "date")
 */
export function filterByPeriod(records, period, dateField = "date") {
  if (!period || period === "all") return records;
  const range = getDateRange(period);
  if (!range) return records;
  return records.filter((r) => {
    const d = new Date(r[dateField]);
    return d >= range.from && d <= range.to;
  });
}

/**
 * Filter records by location ObjectId (or populated location object).
 * @param {Array} records
 * @param {string} locationId – the selected location _id or "all"
 * @param {string} locationField – field name on each record
 */
export function filterByLocation(records, locationId, locationField = "location") {
  if (!locationId || locationId === "all") return records;
  return records.filter((r) => {
    const loc = r[locationField];
    if (!loc) return false;
    const locId = typeof loc === "object" ? loc?._id : loc;
    return locId === locationId;
  });
}
