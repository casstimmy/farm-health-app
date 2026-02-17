"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { FaDatabase, FaSpinner, FaCheckCircle, FaExclamationTriangle } from "react-icons/fa";
import PageHeader from "@/components/shared/PageHeader";
import { useRole } from "@/hooks/useRole";
import Loader from "@/components/Loader";

export default function SeedDatabase() {
  const router = useRouter();
  const { user, isLoading: roleLoading, isAdmin } = useRole();
  const [seeding, setSeeding] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Set initial online status
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (roleLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader message="Loading..." />
      </div>
    );
  }

  if (!user || !isAdmin()) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <FaExclamationTriangle className="text-yellow-500 text-5xl mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-gray-600">Only SuperAdmin can seed the database.</p>
        </div>
      </div>
    );
  }

  const handleSeed = async () => {
    if (!confirm("⚠️ This will DELETE ALL existing data and re-seed with fresh sample data. This cannot be undone. Continue?")) {
      return;
    }

    setSeeding(true);
    setResult(null);
    setError("");

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/seed", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Seeding failed");
        return;
      }

      setResult(data.results);
    } catch (err) {
      setError("Failed to seed database. Please try again.");
    } finally {
      setSeeding(false);
    }
  };

  const resultItems = result
    ? [
        { label: "Locations", count: result.locations },
        { label: "Inventory Categories", count: result.inventoryCategories },
        { label: "Inventory Items", count: result.inventoryItems },
        { label: "Feed Types", count: result.feedTypes },
        { label: "Animals", count: result.animals },
        { label: "Treatments", count: result.treatments },
        { label: "Feeding Records", count: result.feedingRecords },
        { label: "Weight Records", count: result.weightRecords },
        { label: "Vaccination Records", count: result.vaccinationRecords },
        { label: "Breeding Records", count: result.breedingRecords },
        { label: "Mortality Records", count: result.mortalityRecords },
        { label: "Financial Transactions", count: result.financialTransactions },
      ]
    : [];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      <PageHeader
        title="Seed Database"
        subtitle="Insert sample data for testing and demonstration"
        gradient="from-purple-600 to-purple-700"
        icon="🌱"
      />

      <div className="max-w-2xl mx-auto">
        {/* Seed Card */}
        <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-8">
          {!isOnline && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 rounded-lg border-l-4 bg-orange-50 border-orange-500 text-orange-700 font-semibold flex items-center gap-2"
            >
              <span>📡</span>
              <span>You are currently offline. Seeding data is disabled until connection is restored.</span>
            </motion.div>
          )}
          <div className="text-center">
            <FaDatabase className="text-purple-500 text-5xl mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Seed Sample Data
            </h2>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              This will insert realistic sample data into your database including
              animals, treatments, feeding records, weight records, breeding
              records, mortality records, inventory, and financial transactions.
            </p>

            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
              <p className="text-yellow-800 text-sm">
                <FaExclamationTriangle className="inline mr-2" />
                Existing records with the same unique IDs (tagId, breedingId,
                category names) will be <strong>skipped</strong>, not
                overwritten.
              </p>
            </div>

            <button
              onClick={handleSeed}
              disabled={seeding || !isOnline}
              title={!isOnline ? "App is offline - seeding is disabled" : ""}
              className={`px-8 py-4 rounded-xl text-white font-semibold text-lg transition-all ${
                seeding || !isOnline
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-purple-600 hover:bg-purple-700 hover:shadow-lg active:scale-95"
              }`}
            >
              {seeding ? (
                <span className="flex items-center gap-3">
                  <FaSpinner className="animate-spin" />
                  Seeding Database...
                </span>
              ) : !isOnline ? (
                <span className="flex items-center gap-3">
                  <span>📡</span>
                  Offline - Cannot Seed
                </span>
              ) : (
                <span className="flex items-center gap-3">
                  <FaDatabase />
                  Seed Database Now
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 rounded-xl p-6 mt-6"
          >
            <h3 className="text-red-800 font-semibold text-lg mb-1">
              <FaExclamationTriangle className="inline mr-2" />
              Seeding Failed
            </h3>
            <p className="text-red-600">{error}</p>
          </motion.div>
        )}

        {/* Results */}
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-50 border border-green-200 rounded-xl p-6 mt-6"
          >
            <h3 className="text-green-800 font-semibold text-lg mb-4 flex items-center gap-2">
              <FaCheckCircle />
              Seeding Complete
            </h3>

            <div className="grid grid-cols-2 gap-3">
              {resultItems.map((item) => (
                <div
                  key={item.label}
                  className="flex justify-between items-center bg-white rounded-lg px-4 py-2 border border-green-100"
                >
                  <span className="text-gray-700 text-sm">{item.label}</span>
                  <span
                    className={`font-bold text-sm px-2 py-0.5 rounded ${
                      item.count > 0
                        ? "text-green-700 bg-green-100"
                        : "text-gray-400 bg-gray-100"
                    }`}
                  >
                    {item.count > 0 ? `+${item.count}` : "0 (exists)"}
                  </span>
                </div>
              ))}
            </div>

            {result.errors && result.errors.length > 0 && (
              <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <h4 className="text-yellow-800 font-semibold text-sm mb-2">
                  Warnings:
                </h4>
                <ul className="list-disc list-inside text-yellow-700 text-xs space-y-1">
                  {result.errors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

SeedDatabase.layoutType = "default";
SeedDatabase.layoutProps = { title: "Seed Database" };
