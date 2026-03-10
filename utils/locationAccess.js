/**
 * Get the location IDs that the current user has access to.
 * - SuperAdmin: null (access to all)
 * - Manager/Admin: their locations array (or single location)
 * - Attendant: their single assigned location only
 *
 * @param {Object} user - The decoded JWT user (req.user)
 * @returns {string[]|null} Array of location ObjectId strings, or null for all access
 */
export function getUserLocationIds(user) {
  if (!user) return [];
  if (user.role === "SuperAdmin") return null; // null means all access

  const locIds = [];
  if (user.locations && Array.isArray(user.locations) && user.locations.length > 0) {
    user.locations.forEach((l) => {
      const id = typeof l === "object" ? (l?._id?.toString() || l?.toString()) : l?.toString();
      if (id) locIds.push(id);
    });
  }
  if (user.location) {
    const mainLoc = typeof user.location === "object"
      ? (user.location?._id?.toString() || user.location?.toString())
      : user.location?.toString();
    if (mainLoc && !locIds.includes(mainLoc)) locIds.push(mainLoc);
  }

  return locIds;
}

/**
 * Build a MongoDB filter condition for location-based access.
 * @param {Object} user - decoded JWT user
 * @param {string} fieldName - the location field path in the collection (default "location")
 * @returns {Object|null} A filter object to $and with, or null if no filter needed
 */
export function buildLocationFilter(user, fieldName = "location") {
  const locIds = getUserLocationIds(user);
  if (locIds === null) return null; // SuperAdmin - no filter
  if (locIds.length === 0) return { [fieldName]: null }; // No locations assigned - show nothing
  if (locIds.length === 1) return { [fieldName]: locIds[0] };
  return { [fieldName]: { $in: locIds } };
}

/**
 * Get location IDs from localStorage user data (client-side).
 * Uses the selectedLocationId stored during login.
 * @param {Object} user - parsed user from localStorage
 * @returns {string[]|null} Array of location IDs, or null for all access
 */
export function getClientLocationIds(user) {
  if (!user) return [];
  if (user.role === "SuperAdmin") return null; // all access

  const locIds = [];
  // For attendants, use only the selected (locked) location
  if (user.role === "Attendant") {
    if (user.selectedLocationId) return [user.selectedLocationId];
    if (user.location) {
      const l = typeof user.location === "object" ? user.location?._id : user.location;
      if (l) return [l];
    }
    return [];
  }

  // Manager/Admin: use their locations array
  if (user.locations && Array.isArray(user.locations) && user.locations.length > 0) {
    user.locations.forEach((l) => {
      const id = typeof l === "string" ? l : l?.toString();
      if (id) locIds.push(id);
    });
  }
  if (user.location) {
    const mainLoc = typeof user.location === "string" ? user.location : user.location?.toString();
    if (mainLoc && !locIds.includes(mainLoc)) locIds.push(mainLoc);
  }

  return locIds.length > 0 ? locIds : [];
}
