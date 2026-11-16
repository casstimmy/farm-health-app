import bcrypt from "bcryptjs";

/**
 * Staff PINs are stored as bcrypt hashes. Accounts created before hashing was
 * introduced still hold the plain 4 digits; those are accepted once and
 * re-stored hashed at the next successful login (see pages/api/auth/login.js).
 */
const BCRYPT_PATTERN = /^\$2[aby]\$\d{2}\$.{53}$/;

export const MAX_FAILED_ATTEMPTS = 5;
export const LOCK_MINUTES = 15;

export function isValidPinFormat(pin) {
  return typeof pin === "string" && /^\d{4}$/.test(pin);
}

export function isHashedPin(value) {
  return typeof value === "string" && BCRYPT_PATTERN.test(value);
}

export function hashPin(pin) {
  return bcrypt.hash(pin, 10);
}

/**
 * @returns {Promise<{ ok: boolean, needsRehash: boolean }>}
 */
export async function verifyPin(pin, stored) {
  if (!isValidPinFormat(pin) || typeof stored !== "string" || !stored) {
    return { ok: false, needsRehash: false };
  }
  if (isHashedPin(stored)) {
    return { ok: await bcrypt.compare(pin, stored), needsRehash: false };
  }
  // Legacy plain-text PIN
  return { ok: stored === pin, needsRehash: stored === pin };
}
