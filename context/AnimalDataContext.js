"use client";

import { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";

const AnimalDataContext = createContext(null);

/**
 * Global Animal Data Provider
 * - Auto-fetches animals on mount
 * - Provides animals array to all consumers
 * - fetchAnimals() re-fetches fresh data from API
 * - Mutation helpers: addAnimalToCache, updateAnimalInCache, removeAnimalFromCache
 */
export function AnimalDataProvider({ children }) {
  const [animals, setAnimals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const hasLoadedRef = useRef(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  /** Fetch all animals from the API */
  const fetchAnimals = useCallback(async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      if (isMountedRef.current) setLoading(false);
      return [];
    }
    try {
      // Only show loading spinner on first load to prevent flicker
      if (!hasLoadedRef.current && isMountedRef.current) setLoading(true);
      const res = await fetch("/api/animals", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch animals");
      const data = await res.json();
      const result = Array.isArray(data) ? data : [];
      if (isMountedRef.current) {
        setAnimals(result);
        setError(null);
        hasLoadedRef.current = true;
      }
      return result;
    } catch (err) {
      if (isMountedRef.current) setError(err.message);
      return [];
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }, []);

  // Auto-fetch on mount
  useEffect(() => {
    fetchAnimals();
  }, [fetchAnimals]);

  /** Update a single animal in cache (after editing) */
  const updateAnimalInCache = useCallback((animalId, updatedFields) => {
    setAnimals((prev) =>
      prev.map((a) => (a._id === animalId ? { ...a, ...updatedFields } : a))
    );
  }, []);

  /** Add a new animal to cache */
  const addAnimalToCache = useCallback((newAnimal) => {
    setAnimals((prev) => [newAnimal, ...prev]);
  }, []);

  /** Remove an animal from cache */
  const removeAnimalFromCache = useCallback((animalId) => {
    setAnimals((prev) => prev.filter((a) => a._id !== animalId));
  }, []);

  /** Get a single animal by ID from cache */
  const getAnimalById = useCallback(
    (id) => animals.find((a) => a._id === id) || null,
    [animals]
  );

  return (
    <AnimalDataContext.Provider
      value={{
        animals,
        loading,
        error,
        fetchAnimals,
        updateAnimalInCache,
        addAnimalToCache,
        removeAnimalFromCache,
        getAnimalById,
      }}
    >
      {children}
    </AnimalDataContext.Provider>
  );
}

/**
 * Hook to access global animal data from any component
 * Usage: const { animals, loading, fetchAnimals, updateAnimalInCache } = useAnimalData();
 */
export function useAnimalData() {
  const ctx = useContext(AnimalDataContext);
  if (!ctx) {
    throw new Error("useAnimalData must be used within an AnimalDataProvider");
  }
  return ctx;
}
