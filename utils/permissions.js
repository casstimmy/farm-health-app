/**
 * One place for "who may do what" on the API.
 * Mirrors the default matrix on the Roles & Permissions screen:
 *  - SuperAdmin: everything, and the only role that can delete
 *  - SubAdmin / Manager: create and edit operational records
 *  - Attendant: view, and record day-to-day entries
 */
export const ALL_ROLES = ["SuperAdmin", "SubAdmin", "Manager", "Attendant"];

export const ADMIN = ["SuperAdmin"];
export const MANAGE = ["SuperAdmin", "SubAdmin", "Manager"];
export const SENIOR = ["SuperAdmin", "Manager"];

export function hasRole(user, roles) {
  return !!user && Array.isArray(roles) && roles.includes(user.role);
}

/** Escape user-typed text before using it inside a MongoDB $regex / RegExp. */
export function escapeRegex(value) {
  return String(value ?? "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** True when value looks like a MongoDB ObjectId string. */
export function isObjectId(value) {
  return typeof value === "string" && /^[0-9a-fA-F]{24}$/.test(value);
}
