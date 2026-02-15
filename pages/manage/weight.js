"use client";

import { useState, useEffect, useMemo, useContext } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { FaPlus, FaTimes, FaSpinner, FaCheck, FaArrowUp, FaArrowDown, FaMinus } from "react-icons/fa";
import PageHeader from "@/components/shared/PageHeader";
import FilterBar from "@/components/shared/FilterBar";
import Loader from "@/components/Loader";
import { BusinessContext } from "@/context/BusinessContext";
import { useRole } from "@/hooks/useRole";

export default function WeightTracking() {
  const router = useRouter();
  const { businessSettings } = useContext(BusinessContext);
  const { user } = useRole();
  const [animals, setAnimals] = useState([]);
  const [allRecords, setAllRecords] = useState([]); // all weight records
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Form state
  const [formAnimalId, setFormAnimalId] = useState("");
  const [formDate, setFormDate] = useState(new Date().toISOString().split("T")[0]);
  const [formWeight, setFormWeight] = useState("");
  const [formNotes, setFormNotes] = useState("");

  // View mode
  const [viewMode, setViewMode] = useState("overview"); // "overview" | "history"
  const [historyAnimalId, setHistoryAnimalId] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }
    fetchAll();
  }, [router]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const [animalsRes, recordsRes] = await Promise.all([
        fetch("/api/animals", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/weight", { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (animalsRes.ok) {
        const data = await animalsRes.json();
        setAnimals(Array.isArray(data) ? data : []);
      }
      if (recordsRes.ok) {
        const data = await recordsRes.json();
        setAllRecords(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  // Alive, non-archived animals
  const aliveAnimals = animals.filter((a) => a.status === "Alive" && !a.isArchived);

  // Build per-animal weight summary
  const animalWeightSummary = useMemo(() => {
    return aliveAnimals.map((animal) => {
      const animalRecords = allRecords
        .filter((r) => {
          const rid = r.animal?._id || r.animal;
          return rid === animal._id;
        })
        .sort((a, b) => new Date(b.date) - new Date(a.date));

      const currentWeight = animal.currentWeight || (animalRecords[0]?.weightKg ?? null);
      const previousWeight = animalRecords[1]?.weightKg ?? null;
      const birthWeight = animal.birthWeight || null;
      const projectedMax = animal.projectedMaxWeight || null;
      const projectedSalesWeight = animal.projectedSalesWeight || null;

      let change = null;
      let changePercent = null;
      if (currentWeight && previousWeight) {
        change = +(currentWeight - previousWeight).toFixed(2);
        changePercent = +((change / previousWeight) * 100).toFixed(1);
      }

      let projectedPct = null;
      if (currentWeight && projectedMax) {
        projectedPct = +((currentWeight / projectedMax) * 100).toFixed(0);
      }

      return {
        ...animal,
        currentWeight,
        previousWeight,
        birthWeight,
        projectedMax,
        projectedSalesWeight,
        change,
        changePercent,
        projectedPct,
        recordCount: animalRecords.length,
        lastRecordDate: animalRecords[0]?.date || null,
      };
    });
  }, [aliveAnimals, allRecords]);

  // Filtered
  const filtered = animalWeightSummary.filter((a) => {
    if (!searchTerm) return true;
    return (
      a.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.tagId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.breed?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // History records for selected animal
  const historyRecords = useMemo(() => {
    if (!historyAnimalId) return [];
    return allRecords
      .filter((r) => {
        const rid = r.animal?._id || r.animal;
        return rid === historyAnimalId;
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [historyAnimalId, allRecords]);

  const historyAnimal = animals.find((a) => a._id === historyAnimalId);

  // Stats
  const avgWeight = aliveAnimals.length > 0
    ? (aliveAnimals.reduce((sum, a) => sum + (a.currentWeight || 0), 0) / aliveAnimals.length).toFixed(1)
    : 0;
  const totalRecords = allRecords.length;
  const gainers = animalWeightSummary.filter((a) => a.change > 0).length;
  const losers = animalWeightSummary.filter((a) => a.change < 0).length;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!formAnimalId) { setError("Please select an animal."); return; }
    if (!formWeight) { setError("Weight is required."); return; }

    setFormLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/weight", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          animalId: formAnimalId,
          weightData: {
            date: formDate ? new Date(formDate) : new Date(),
            weightKg: Number(formWeight),
            notes: formNotes.trim() || undefined,
          },
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error || "Failed to save");
      }
      setSuccess("Weight record saved!");
      setFormWeight("");
      setFormNotes("");
      setShowForm(false);
      fetchAll();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Weight Tracking"
        subtitle="Monitor and compare animal weight progression"
        icon="⚖️"
        actions={
          <button
            onClick={() => { setShowForm(!showForm); setError(""); }}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium"
          >
            {showForm ? <FaTimes /> : <FaPlus />}
            {showForm ? "Cancel" : "Record Weight"}
          </button>
        }
      />

      {/* Messages */}
      {error && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
          {error}
          <button onClick={() => setError("")} className="ml-4 text-red-500 hover:text-red-700"><FaTimes /></button>
        </motion.div>
      )}
      {success && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-green-50 border border-green-200 rounded-xl text-green-700">
          {success}
        </motion.div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
          <p className="text-sm text-gray-600">Avg Weight</p>
          <p className="text-2xl font-bold text-gray-900">{avgWeight} kg</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-sm text-gray-600">Total Records</p>
          <p className="text-2xl font-bold text-gray-900">{totalRecords}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <p className="text-sm text-gray-600">Gaining Weight</p>
          <p className="text-2xl font-bold text-green-700">{gainers}</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-sm text-gray-600">Losing Weight</p>
          <p className="text-2xl font-bold text-red-700">{losers}</p>
        </div>
      </div>

      {/* Add Weight Form */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="bg-white rounded-xl shadow-lg border border-gray-200 p-6"
        >
          <h3 className="text-lg font-bold text-gray-900 mb-4">Record Weight</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Animal *</label>
                <select
                  value={formAnimalId}
                  onChange={(e) => setFormAnimalId(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                  required
                >
                  <option value="">-- Select Animal --</option>
                  {aliveAnimals.map((a) => (
                    <option key={a._id} value={a._id}>
                      {a.name ? `${a.name} (${a.tagId})` : a.tagId} — {a.currentWeight || "?"}kg
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Weight (kg) *</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={formWeight}
                  onChange={(e) => setFormWeight(e.target.value)}
                  placeholder="e.g., 42.5"
                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Notes</label>
                <input
                  type="text"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Optional notes"
                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
              <button type="submit" disabled={formLoading} className="flex items-center gap-2 px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium disabled:opacity-60">
                {formLoading ? <FaSpinner className="animate-spin" /> : <FaCheck />}
                Save Weight
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* View Toggle */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => { setViewMode("overview"); setHistoryAnimalId(""); }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${viewMode === "overview" ? "bg-purple-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
        >
          All Animals Overview
        </button>
        <button
          onClick={() => setViewMode("history")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${viewMode === "history" ? "bg-purple-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
        >
          Weight History
        </button>
      </div>

      {/* Filter */}
      <FilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        placeholder="Search by name, tag, or breed..."
      />

      {viewMode === "overview" ? (
        /* ALL ANIMALS WEIGHT TABLE */
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <span className="text-5xl mb-4 block">⚖️</span>
              <p className="text-gray-500 text-lg">No animals found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b-2 border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-900 uppercase">Animal</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-900 uppercase">Tag</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-900 uppercase">Breed</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-900 uppercase">Birth Wt</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-900 uppercase">Current Wt</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-900 uppercase">Previous</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-900 uppercase">Change</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-900 uppercase">Projected Max</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-900 uppercase">% of Max</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-900 uppercase">Records</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-900 uppercase">Last Weighed</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-900 uppercase">History</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filtered.map((animal, idx) => (
                    <motion.tr
                      key={animal._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.02 }}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900">{animal.name || "—"}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{animal.tagId}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{animal.breed || "—"}</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-700">
                        {animal.birthWeight ? `${animal.birthWeight} kg` : "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-bold text-gray-900">
                        {animal.currentWeight ? `${animal.currentWeight} kg` : "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-600">
                        {animal.previousWeight ? `${animal.previousWeight} kg` : "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-center">
                        {animal.change !== null ? (
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                            animal.change > 0 ? "bg-green-100 text-green-800" :
                            animal.change < 0 ? "bg-red-100 text-red-800" :
                            "bg-gray-100 text-gray-800"
                          }`}>
                            {animal.change > 0 ? <FaArrowUp size={10} /> : animal.change < 0 ? <FaArrowDown size={10} /> : <FaMinus size={10} />}
                            {Math.abs(animal.change)} kg ({Math.abs(animal.changePercent)}%)
                          </span>
                        ) : "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-700">
                        {animal.projectedMax ? `${animal.projectedMax} kg` : "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-center">
                        {animal.projectedPct !== null ? (
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[80px]">
                              <div
                                className={`h-2 rounded-full ${animal.projectedPct >= 100 ? 'bg-green-500' : animal.projectedPct >= 75 ? 'bg-blue-500' : 'bg-purple-500'}`}
                                style={{ width: `${Math.min(animal.projectedPct, 100)}%` }}
                              />
                            </div>
                            <span className="text-xs font-semibold">{animal.projectedPct}%</span>
                          </div>
                        ) : "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-center text-gray-700">{animal.recordCount}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {animal.lastRecordDate ? new Date(animal.lastRecordDate).toLocaleDateString() : "Never"}
                      </td>
                      <td className="px-4 py-3 text-sm text-center">
                        <button
                          onClick={() => { setHistoryAnimalId(animal._id); setViewMode("history"); }}
                          className="text-purple-600 hover:text-purple-800 font-medium text-xs underline"
                        >
                          View
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* WEIGHT HISTORY VIEW */
        <div className="space-y-4">
          {/* Animal selector for history */}
          <div className="bg-white rounded-xl shadow border border-gray-200 p-4 flex flex-col md:flex-row md:items-center gap-4">
            <label className="text-sm font-semibold text-gray-700">Select Animal:</label>
            <select
              value={historyAnimalId}
              onChange={(e) => setHistoryAnimalId(e.target.value)}
              className="w-full md:w-80 px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
            >
              <option value="">-- Choose Animal --</option>
              {aliveAnimals.map((a) => (
                <option key={a._id} value={a._id}>
                  {a.name ? `${a.name} (${a.tagId})` : a.tagId} — {a.currentWeight || "?"}kg
                </option>
              ))}
            </select>
            {historyAnimal && (
              <div className="flex gap-4 text-sm text-gray-600">
                <span>Birth: <strong>{historyAnimal.birthWeight || "?"} kg</strong></span>
                <span>Current: <strong>{historyAnimal.currentWeight || "?"} kg</strong></span>
                <span>Projected Max: <strong>{historyAnimal.projectedMaxWeight || "?"} kg</strong></span>
              </div>
            )}
          </div>

          {/* History Table */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            {historyRecords.length === 0 ? (
              <div className="text-center py-16">
                <span className="text-5xl mb-4 block">📊</span>
                <p className="text-gray-500 text-lg">{historyAnimalId ? "No weight records for this animal" : "Select an animal to view history"}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b-2 border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-900 uppercase">#</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-900 uppercase">Date</th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-gray-900 uppercase">Weight (kg)</th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-gray-900 uppercase">Change</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-900 uppercase">Recorded By</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-900 uppercase">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {historyRecords.map((record, idx) => {
                      const prev = historyRecords[idx + 1];
                      const diff = prev ? +(record.weightKg - prev.weightKg).toFixed(2) : null;
                      return (
                        <motion.tr
                          key={record._id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: idx * 0.03 }}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-6 py-4 text-sm text-gray-500">{historyRecords.length - idx}</td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {record.date ? new Date(record.date).toLocaleDateString() : "—"}
                          </td>
                          <td className="px-6 py-4 text-sm text-right font-bold text-gray-900">{record.weightKg} kg</td>
                          <td className="px-6 py-4 text-sm text-center">
                            {diff !== null ? (
                              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                                diff > 0 ? "bg-green-100 text-green-800" :
                                diff < 0 ? "bg-red-100 text-red-800" :
                                "bg-gray-100 text-gray-800"
                              }`}>
                                {diff > 0 ? <FaArrowUp size={10} /> : diff < 0 ? <FaArrowDown size={10} /> : <FaMinus size={10} />}
                                {diff > 0 ? "+" : ""}{diff} kg
                              </span>
                            ) : (
                              <span className="text-gray-400 text-xs">First record</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">{record.recordedBy || "—"}</td>
                          <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">{record.notes || "—"}</td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

WeightTracking.layoutType = "default";
WeightTracking.layoutProps = { title: "Weight Tracking" };
