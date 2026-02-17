/**
 * Simple client-side session cache for API responses.
 * Reduces redundant API calls during a single session.
 * Cache is cleared on page refresh.
 */

const cache = new Map();
const requestInProgress = new Map();

function getSessionSuffix() {
  if (typeof window === "undefined") return "server";

  try {
    const token = localStorage.getItem("token");
    if (!token) return "guest";

    // Use a short suffix to isolate cache across sessions without storing sensitive data.
    return token.slice(-12);
  } catch (error) {
    return "guest";
  }
}

function normalizeKey(key) {
  return `${key}::${getSessionSuffix()}`;
}

/**
 * Get cached data or fetch if not cached
 * @param {string} key - Unique cache key (usually the API endpoint)
 * @param {Function} fetchFn - Async function that fetches the data
 * @param {number} ttl - Time to live in milliseconds (default: 5 minutes)
 * @returns {Promise<any>} - The cached or fetched data
 */
export async function getCachedData(key, fetchFn, ttl = 5 * 60 * 1000) {
  const now = Date.now();
  const scopedKey = normalizeKey(key);

  // Check if data is still in cache and not expired
  if (cache.has(scopedKey)) {
    const { data, timestamp } = cache.get(scopedKey);
    if (now - timestamp < ttl) {
      return data;
    } else {
      cache.delete(scopedKey);
    }
  }

  // If request is already in progress, wait for it
  if (requestInProgress.has(scopedKey)) {
    return requestInProgress.get(scopedKey);
  }

  // Fetch new data
  const promise = (async () => {
    try {
      const data = await fetchFn();

      // Avoid caching transient empty API payloads (common during token race or intermittent failures).
      const shouldSkipApiEmptyArray = key.startsWith("api/") && Array.isArray(data) && data.length === 0;
      if (!shouldSkipApiEmptyArray) {
        cache.set(scopedKey, { data, timestamp: Date.now() });
      }

      requestInProgress.delete(scopedKey);
      return data;
    } catch (error) {
      requestInProgress.delete(scopedKey);
      throw error;
    }
  })();

  requestInProgress.set(scopedKey, promise);
  return promise;
}

/**
 * Invalidate a specific cache entry
 * @param {string} key - Cache key to invalidate
 */
export function invalidateCache(key) {
  const suffix = getSessionSuffix();
  const scopedKey = `${key}::${suffix}`;
  cache.delete(scopedKey);
  requestInProgress.delete(scopedKey);
}

/**
 * Invalidate all cache entries matching a pattern
 * @param {string} pattern - Pattern to match (e.g., "/api/animals")
 */
export function invalidateCachePattern(pattern) {
  for (const key of cache.keys()) {
    if (key.includes(pattern)) {
      cache.delete(key);
    }
  }
  for (const key of requestInProgress.keys()) {
    if (key.includes(pattern)) {
      requestInProgress.delete(key);
    }
  }
}

/**
 * Clear all cache
 */
export function clearAllCache() {
  cache.clear();
  requestInProgress.clear();
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  return {
    cacheSize: cache.size,
    inProgress: requestInProgress.size,
  };
}
