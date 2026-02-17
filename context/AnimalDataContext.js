"use client";

import { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";

const AnimalDataContext = createContext(null);

/**
 * Global Animal Data Provider
 * Loads animal data ONCE and shares it across all pages.
 * Provides targeted update/invalidation for individual animals.
 * Other pages simply call useAnimalData() to get the cached data.
 */
export function AnimalDataProvider({ children }) {
  const [animals, setAnimals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastFetched, setLastFetched] = useState(null);
  const fetchPromiseRef = useRef(null);
  const isMountedRef = useRef(true);
  const hasLoadedOnce = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  /**
   * Fetch all animals from API (only if not already loaded or stale)
   * - De-duplicates concurrent calls
   * - 10-minute stale threshold
   * - Only shows loading spinner on first load (prevents flickering)
   */
  const fetchAnimals = useCallback(async (force = false) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) return [];

    // If data is fresh (under 10 minutes) and not forced, return cached
    const STALE_MS = 10 * 60 * 1000;
    if (!force && lastFetched && (Date.now() - lastFetched < STALE_MS) && animals.length > 0) {
      return animals;
    }

    // De-duplicate concurrent requests
    if (fetchPromiseRef.current) {
      return fetchPromiseRef.current;
    }

    const promise = (async () => {
      try {
        // Only show loading spinner on first load to prevent data flickering
        if (!hasLoadedOnce.current && isMountedRef.current) setLoading(true);
        const res = await fetch("/api/animals", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch animals");
        const data = await res.json();
        const result = Array.isArray(data) ? data : [];
        if (isMountedRef.current) {
          setAnimals(result);
          setLastFetched(Date.now());
          setError(null);
          hasLoadedOnce.current = true;
        }
        return result;
      } catch (err) {
        if (isMountedRef.current) setError(err.message);
        return animals; // Return stale data on error
      } finally {
        if (isMountedRef.current) setLoading(false);
        fetchPromiseRef.current = null;
      }
    })();

    fetchPromiseRef.current = promise;
    return promise;
  }, [animals, lastFetched]);

  /**
   * Update a single animal in the cache (no re-fetch needed)
   * Use after editing an animal's fields
   */
  const updateAnimalInCache = useCallback((animalId, updatedFields) => {
    setAnimals((prev) =>
      prev.map((a) =>
        a._id === animalId ? { ...a, ...updatedFields } : a
      )
    );
  }, []);

  /**
   * Add a new animal to the cache
   */
  const addAnimalToCache = useCallback((newAnimal) => {
    setAnimals((prev) => [newAnimal, ...prev]);
  }, []);

  /**
   * Remove an animal from the cache
   */
  const removeAnimalFromCache = useCallback((animalId) => {
    setAnimals((prev) => prev.filter((a) => a._id !== animalId));
  }, []);

  /**
   * Force refresh — re-downloads everything from DB
   * Use sparingly: after bulk operations, seed, etc.
   */
  const forceRefresh = useCallback(() => {
    setLastFetched(null);
    return fetchAnimals(true);
  }, [fetchAnimals]);

  /**
   * Get a single animal from cache by ID
   */
  const getAnimalById = useCallback(
    (id) => animals.find((a) => a._id === id) || null,
    [animals]
  );

  const value = {
    animals,
    loading,
    error,
    lastFetched,
    fetchAnimals,
    updateAnimalInCache,
    addAnimalToCache,
    removeAnimalFromCache,
    forceRefresh,
    getAnimalById,
  };

  return (
    <AnimalDataContext.Provider value={value}>
      {children}
    </AnimalDataContext.Provider>
  );
}

/**
 * Hook to access global animal data from any component
 *
 * Usage:
 *   const { animals, loading, fetchAnimals, updateAnimalInCache } = useAnimalData();
 */
export function useAnimalData() {
  const ctx = useContext(AnimalDataContext);
  if (!ctx) {
    throw new Error("useAnimalData must be used within an AnimalDataProvider");
  }
  return ctx;
}
