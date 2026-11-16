import { getUserLocationIds } from "@/utils/locationAccess";
import { isObjectId } from "@/utils/permissions";

/**
 * Can this user touch a record that belongs to the given location?
 * SuperAdmin: always. Others: only their own locations. Records with no
 * location set are not location-restricted.
 */
export function userCanAccessLocation(user, locationId) {
  const allowed = getUserLocationIds(user);
  if (allowed === null) return true; // SuperAdmin
  if (!locationId) return true;
  const id = typeof locationId === "object" && locationId._id ? locationId._id : locationId;
  return allowed.includes(id.toString());
}

/**
 * Guard for /api/<thing>/[id] routes. Sends the error response itself and
 * returns true when the request must stop.
 *
 *   if (await denyIfOutsideLocation(req, res, Animal, id)) return;
 */
export async function denyIfOutsideLocation(req, res, Model, id, field = "location") {
  if (!isObjectId(String(id))) {
    res.status(400).json({ error: "Invalid ID" });
    return true;
  }
  const doc = await Model.findById(id).select(field).lean();
  if (doc && !userCanAccessLocation(req.user, doc[field])) {
    res.status(403).json({ error: "Forbidden: This record belongs to another location" });
    return true;
  }
  return false;
}
