/**
 * Simple client-side session cache for API responses.
 * Reduces redundant API calls during a single session.
 * Cache is cleared on page refresh.
 */

const cache = new Map();
const requestInProgress = new Map();

/**
 * Get cached data or fetch if not cached
 * @param {string} key - Unique cache key (usually the API endpoint)
 * @param {Function} fetchFn - Async function that fetches the data
 * @param {number} ttl - Time to live in milliseconds (default: 5 minutes)
 * @returns {Promise<any>} - The cached or fetched data
 */
export async function getCachedData(key, fetchFn, ttl = 5 * 60 * 1000) {
  const now = Date.now();

  // Check if data is still in cache and not expired
  if (cache.has(key)) {
    const { data, timestamp } = cache.get(key);
    if (now - timestamp < ttl) {
      return data;
    } else {
      cache.delete(key);
    }
  }

  // If request is already in progress, wait for it
  if (requestInProgress.has(key)) {
    return requestInProgress.get(key);
  }

  // Fetch new data
  const promise = (async () => {
    try {
      const data = await fetchFn();
      cache.set(key, { data, timestamp: now });
      requestInProgress.delete(key);
      return data;
    } catch (error) {
      requestInProgress.delete(key);
      throw error;
    }
  })();

  requestInProgress.set(key, promise);
  return promise;
}

/**
 * Invalidate a specific cache entry
 * @param {string} key - Cache key to invalidate
 */
export function invalidateCache(key) {
  cache.delete(key);
  requestInProgress.delete(key);
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
