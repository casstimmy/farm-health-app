/**
 * Currency & Formatting Utilities
 * Uses business settings currency from context
 */

/**
 * Map DB role names to user-facing display names.
 * DB stores "SubAdmin" but UI shows "Admin".
 */
const ROLE_DISPLAY_NAMES = {
  SuperAdmin: "SuperAdmin",
  SubAdmin: "Admin",
  Manager: "Manager",
  Attendant: "Attendant",
};

export const displayRole = (role) => ROLE_DISPLAY_NAMES[role] || role;

export const getCurrencySymbol = (currency) => {
  const symbols = {
    NGN: "₦",
    USD: "$",
    EUR: "€",
    GBP: "£",
  };
  return symbols[currency] || currency;
};

export const formatCurrency = (value = 0, currency = "NGN") => {
  const symbol = getCurrencySymbol(currency);
  return `${symbol}${Number(value).toLocaleString("en-US")}`;
};

/**
 * Returns true if the given role should NOT see monetary values.
 * Used to hide prices/costs from Attendant role.
 */
export const shouldHideAmounts = (role) => {
  return role === "Attendant";
};

/**
 * Formats currency but returns "***" if the role should not see amounts.
 */
export const formatCurrencyByRole = (value = 0, currency = "NGN", role = "") => {
  if (shouldHideAmounts(role)) return "***";
  return formatCurrency(value, currency);
};

export const formatNumber = (value = 0) => {
  return Number(value).toLocaleString("en-US");
};

export const formatDate = (date) => {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export const formatDateTime = (date) => {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * Format a date value for <input type="date"> fields.
 * Handles ISO strings (2026-03-02T00:00:00.000Z), Date objects, and "yyyy-MM-dd" strings.
 * Returns "yyyy-MM-dd" format string or "" if invalid.
 */
export const formatDateForInput = (dateValue) => {
  if (!dateValue) return "";
  // Already in correct format
  if (typeof dateValue === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) return dateValue;
  // Extract date part from ISO string directly (avoids timezone shift)
  if (typeof dateValue === "string" && dateValue.includes("T")) {
    return dateValue.split("T")[0];
  }
  // Fallback: parse and format
  try {
    const d = new Date(dateValue);
    if (isNaN(d.getTime())) return "";
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  } catch {
    return "";
  }
};
