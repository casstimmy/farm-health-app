"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { FaPlus, FaTimes } from "react-icons/fa";
import PageHeader from "@/components/shared/PageHeader";
import FilterBar from "@/components/shared/FilterBar";
import Loader from "@/components/Loader";

const initialFormState = {
  date: "",
  weightKg: "",
  notes: "",
};

export default function WeightTracking() {
  const router = useRouter();
  const [animals, setAnimals] = useState([]);
  const [selectedAnimalId, setSelectedAnimalId] = useState("");
  const [records, setRecords] = useState([]);
  const [feedingRecords, setFeedingRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState(initialFormState);
  const [feedsPer10Kg, setFeedsPer10Kg] = useState(1);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    fetchAnimals();
  }, [router]);

  useEffect(() => {
    if (!selectedAnimalId) return;
    fetchRecords(selectedAnimalId);
    fetchFeedingRecords(selectedAnimalId);
  }, [selectedAnimalId]);

  const fetchAnimals = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch("/api/animals", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : [];
        setAnimals(list);
        if (list.length > 0) {
          setSelectedAnimalId(list[0]._id);
        }
      }
    } catch (err) {
      console.error("Failed to fetch animals:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecords = async (animalId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/weight?animalId=${animalId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setRecords(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Failed to fetch records:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFeedingRecords = async (animalId) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/feeding?animalId=${animalId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setFeedingRecords(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Failed to fetch feeding records:", err);
    }
  };

  const selectedAnimal = useMemo(
    () => animals.find((a) => a._id === selectedAnimalId),
    [animals, selectedAnimalId]
  );

  const filteredRecords = records.filter((record) => {
    if (!searchTerm) return true;
    const name = selectedAnimal?.name || "";
    const tag = selectedAnimal?.tagId || "";
    return (
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tag.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const latestWeight = useMemo(() => {
    if (!records.length) return null;
    const sorted = [...records].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    return sorted[0];
  }, [records]);

  const feedingsLast24h = useMemo(() => {
    const since = Date.now() - 24 * 60 * 60 * 1000;
    return feedingRecords.filter((r) => {
      const date = r?.date ? new Date(r.date).getTime() : 0;
      return date >= since;
    }).length;
  }, [feedingRecords]);

  const lastFeedRecord = useMemo(() => {
    if (!feedingRecords.length) return null;
    const sorted = [...feedingRecords].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    return sorted[0];
  }, [feedingRecords]);

  const projectedMaxWeight = useMemo(() => {
    return selectedAnimal?.projectedMaxWeight || null;
  }, [selectedAnimal]);

  const recommendedFeeds = useMemo(() => {
    const weightKg = Number(latestWeight?.weightKg);
    if (!weightKg || Number.isNaN(weightKg)) return null;
    const per10kg = Number(feedsPer10Kg) || 0;
    if (per10kg <= 0) return null;
    return Math.max(1, Math.round(weightKg / 10) * per10kg);
  }, [latestWeight, feedsPer10Kg]);

  const feedCheckStatus =
    recommendedFeeds === null
      ? "unknown"
      : feedingsLast24h > recommendedFeeds
      ? "high"
      : "ok";

  const weightVsProjected = useMemo(() => {
    const current = Number(latestWeight?.weightKg);
    if (!current || !projectedMaxWeight) return null;
    if (current >= projectedMaxWeight) return "reached";
    const pct = ((current / projectedMaxWeight) * 100).toFixed(0);
    return `${pct}%`;
  }, [latestWeight, projectedMaxWeight]);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!selectedAnimalId) {
      setFormError("Please select an animal first.");
      return;
    }

    if (!formData.weightKg) {
      setFormError("Weight is required.");
      return;
    }

    try {
      setFormLoading(true);
      const token = localStorage.getItem("token");
      const payload = {
        animalId: selectedAnimalId,
        weightData: {
          date: formData.date ? new Date(formData.date) : new Date(),
          weightKg: Number(formData.weightKg),
          notes: formData.notes?.trim() || undefined,
        },
      };

      const res = await fetch("/api/weight", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        setFormError(data?.error || "Failed to save weight record.");
        return;
      }

      setFormData(initialFormState);
      setShowForm(false);
      fetchRecords(selectedAnimalId);
      fetchFeedingRecords(selectedAnimalId);
    } catch (err) {
      console.error("Failed to save weight record:", err);
      setFormError("Failed to save weight record.");
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <PageHeader
        title="Weight Tracking"
        subtitle="Monitor and track animal weight progression"
        gradient="from-purple-600 to-purple-700"
        icon="⚖️"
      />

      {/* Controls */}
      <FilterBar
        searchPlaceholder="Search by animal name..."
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        showAddButton={true}
        onAddClick={() => setShowForm(!showForm)}
        isAddActive={showForm}
      />

      {/* Animal Selector */}
      <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-gray-700">Selected Animal</p>
          <p className="text-xs text-gray-500">Choose an animal to view weight history</p>
        </div>
        <select
          value={selectedAnimalId}
          onChange={(e) => setSelectedAnimalId(e.target.value)}
          className="w-full md:w-80 px-3 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          {animals.length === 0 && <option value="">No animals found</option>}
          {animals.map((animal) => (
            <option key={animal._id} value={animal._id}>
              {animal.name ? `${animal.name} (${animal.tagId})` : animal.tagId}
            </option>
          ))}
        </select>
      </div>

      {/* Feed Check */}
      <div className="bg-white rounded-2xl shadow-lg border-2 border-purple-100 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-gray-800">Feed Check vs Current Weight</h3>
            <p className="text-xs text-gray-500">
              Compares feedings in the last 24 hours with a weight-based target.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-gray-600">Feeds per 10kg</label>
            <input
              type="number"
              min="0"
              step="1"
              value={feedsPer10Kg}
              onChange={(e) => setFeedsPer10Kg(e.target.value)}
              className="w-20 px-2 py-1 rounded-md border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <p className="text-gray-500">Current Weight</p>
            <p className="text-lg font-semibold text-gray-800">
              {latestWeight?.weightKg ? `${latestWeight.weightKg} kg` : "No weight record"}
            </p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <p className="text-gray-500">Last Feed Record</p>
            {lastFeedRecord ? (
              <div>
                <p className="text-sm font-semibold text-gray-800">
                  {lastFeedRecord.feedCategory || lastFeedRecord.feedTypeName || "Feed"}
                </p>
                <p className="text-xs text-gray-500">
                  Qty: {lastFeedRecord.quantityConsumed ?? "N/A"} | {lastFeedRecord.date ? new Date(lastFeedRecord.date).toLocaleDateString() : ""}
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-400">No feeding records</p>
            )}
          </div>
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <p className="text-gray-500">Feeds (Last 24h)</p>
            <p className="text-lg font-semibold text-gray-800">{feedingsLast24h}</p>
            {recommendedFeeds && (
              <p className="text-xs text-gray-500">Target: {recommendedFeeds}</p>
            )}
          </div>
          <div
            className={`rounded-xl p-4 border ${
              weightVsProjected === "reached"
                ? "bg-green-50 border-green-200"
                : "bg-purple-50 border-purple-200"
            }`}
          >
            <p className="text-gray-500">Projected Max Weight</p>
            <p
              className={`text-lg font-semibold ${
                weightVsProjected === "reached" ? "text-green-700" : "text-purple-700"
              }`}
            >
              {projectedMaxWeight ? `${projectedMaxWeight} kg` : "Not set"}
            </p>
            {weightVsProjected && weightVsProjected !== "reached" && (
              <p className="text-xs text-gray-500">{weightVsProjected} of projected max</p>
            )}
            {weightVsProjected === "reached" && (
              <p className="text-xs text-green-600 font-semibold">Target reached!</p>
            )}
          </div>
        </div>

        {feedCheckStatus === "high" && (
          <div className="mt-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            Feedings exceed the target for the current weight. Consider reviewing the feeding plan.
          </div>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg border-2 border-purple-100 p-6"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-800">Add Weight Record</h3>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Close form"
              >
                <FaTimes />
              </button>
            </div>

            {formError && (
              <div className="bg-red-50 border border-red-200 rounded-md px-3 py-2 text-red-600 text-sm">
                {formError}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Date</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Weight (kg)</label>
                <input
                  type="number"
                  name="weightKg"
                  value={formData.weightKg}
                  onChange={handleFormChange}
                  step="0.1"
                  min="0"
                  placeholder="e.g., 42.5"
                  className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-600 mb-1">Notes</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleFormChange}
                  rows="3"
                  placeholder="Optional notes..."
                  className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={formLoading}
              className="w-full md:w-auto inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700 disabled:opacity-60"
            >
              <FaPlus />
              {formLoading ? "Saving..." : "Save Weight Record"}
            </button>
          </form>
        </motion.div>
      )}

      {/* Records Table */}
      {loading ? (
        <Loader message="Loading weight records..." color="purple-600" />
      ) : filteredRecords.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center border-2 border-gray-200">
          <p className="text-gray-500 text-lg">No weight records found</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-purple-50 to-purple-100">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Animal</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Weight (kg)</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Date</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredRecords.map((record, idx) => (
                <motion.tr
                  key={record._id || idx}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  className="hover:bg-purple-50 transition-colors"
                >
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {selectedAnimal?.name || selectedAnimal?.tagId || "Unknown"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {record.weightKg ?? "N/A"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {record.date ? new Date(record.date).toLocaleDateString() : "N/A"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{record.notes || "N/A"}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

WeightTracking.layoutType = "default";
WeightTracking.layoutProps = { title: "Weight Tracking" };
