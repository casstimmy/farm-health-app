"use client";

import { useState, useEffect, useMemo, useContext } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { FaPlus, FaTimes, FaSpinner, FaCheck, FaArrowUp, FaArrowDown, FaMinus, FaEdit, FaTrash } from "react-icons/fa";
import PageHeader from "@/components/shared/PageHeader";
import FilterBar from "@/components/shared/FilterBar";
import Loader from "@/components/Loader";
import { BusinessContext } from "@/context/BusinessContext";
import { useRole } from "@/hooks/useRole";
import { PERIOD_OPTIONS, filterByPeriod, filterByLocation } from "@/utils/filterHelpers";
import { useAnimalData } from "@/context/AnimalDataContext";

export default function WeightTracking() {
  const router = useRouter();
  const { businessSettings } = useContext(BusinessContext);
  const { user } = useRole();
  const { animals: globalAnimals, fetchAnimals: fetchGlobalAnimals, updateAnimalInCache } = useAnimalData();
  const [animals, setAnimals] = useState([]);
  const [allRecords, setAllRecords] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPeriod, setFilterPeriod] = useState("all");
  const [filterLocation, setFilterLocation] = useState("all");
  const [editingId, setEditingId] = useState(null);

  const [formAnimalId, setFormAnimalId] = useState("");
  const [formDate, setFormDate] = useState(new Date().toISOString().split("T")[0]);
  const [formWeight, setFormWeight] = useState("");
  const [formLocation, setFormLocation] = useState("");
  const [formNotes, setFormNotes] = useState("");

  const [viewMode, setViewMode] = useState("overview");
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
      // Animals from global context (cached); fetch records and locations in parallel
      const [animalsData, recordsRes, locRes] = await Promise.all([
        fetchGlobalAnimals(),
        fetch("/api/weight", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/locations", { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const animalsList = Array.isArray(animalsData) ? animalsData : [];
      setAnimals(animalsList);
      if (recordsRes.ok) {
        const recordsData = await recordsRes.json();
        setAllRecords(Array.isArray(recordsData) ? recordsData : []);
      } else {
        setAllRecords([]);
      }
      if (locRes.ok) {
        const locsData = await locRes.json();
        setLocations(Array.isArray(locsData) ? locsData : []);
      }
    } catch (err) {
      console.error("Weight fetchAll error:", err);
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const aliveAnimals = animals.filter((a) => a.status === "Alive" && !a.isArchived);

  const animalWeightSummary = useMemo(() => {
    return aliveAnimals.map((animal) => {
      const animalRecords = allRecords
        .filter((r) => {
          const recAnimalId = r.animal?._id || r.animal;
          return String(recAnimalId) === String(animal._id);
        })
        .sort((a, b) => new Date(b.date) - new Date(a.date));
      const currentWeight = animal.currentWeight || (animalRecords[0]?.weightKg ?? null);
      const previousWeight = animalRecords[1]?.weightKg ?? null;
      let change = null, changePercent = null;
      if (currentWeight && previousWeight) {
        change = +(currentWeight - previousWeight).toFixed(2);
        changePercent = +((change / previousWeight) * 100).toFixed(1);
      }
      let projectedPct = null;
      if (currentWeight && animal.projectedMaxWeight) {
        projectedPct = +((currentWeight / animal.projectedMaxWeight) * 100).toFixed(0);
      }
      return { ...animal, currentWeight, previousWeight, birthWeight: animal.birthWeight || null, projectedMax: animal.projectedMaxWeight || null, change, changePercent, projectedPct, recordCount: animalRecords.length, lastRecordDate: animalRecords[0]?.date || null };
    });
  }, [aliveAnimals, allRecords]);

  const filtered = animalWeightSummary.filter((a) => {
    if (!searchTerm) return true;
    return a.name?.toLowerCase().includes(searchTerm.toLowerCase()) || a.tagId?.toLowerCase().includes(searchTerm.toLowerCase()) || a.breed?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const historyRecords = useMemo(() => {
    let recs;
    if (!historyAnimalId || historyAnimalId === "all") {
      // Show all weight records across all animals
      recs = [...allRecords].sort((a, b) => new Date(b.date) - new Date(a.date));
    } else {
      recs = allRecords.filter((r) => {
        const recAnimalId = r.animal?._id || r.animal;
        return String(recAnimalId) === String(historyAnimalId);
      }).sort((a, b) => new Date(b.date) - new Date(a.date));
    }
    recs = filterByPeriod(recs, filterPeriod);
    return recs;
  }, [historyAnimalId, allRecords, filterPeriod]);

  const historyAnimal = animals.find((a) => a._id === historyAnimalId);

  const avgWeight = aliveAnimals.length > 0 ? (aliveAnimals.reduce((sum, a) => sum + (a.currentWeight || 0), 0) / aliveAnimals.length).toFixed(1) : 0;
  const totalRecords = allRecords.length;
  const gainers = animalWeightSummary.filter((a) => a.change > 0).length;
  const losers = animalWeightSummary.filter((a) => a.change < 0).length;

  const resetForm = () => { setFormAnimalId(""); setFormDate(new Date().toISOString().split("T")[0]); setFormWeight(""); setFormLocation(""); setFormNotes(""); setEditingId(null); };

  const handleEdit = (record) => {
    setEditingId(record._id);
    setFormAnimalId(record.animal?._id || record.animal || "");
    setFormDate(record.date ? new Date(record.date).toISOString().split("T")[0] : "");
    setFormWeight(record.weightKg || "");
    setFormLocation(record.location?._id || record.location || "");
    setFormNotes(record.notes || "");
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this weight record?")) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/weight/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Failed to delete");
      setSuccess("Deleted!"); fetchAll(); setTimeout(() => setSuccess(""), 3000);
    } catch (err) { setError(err.message); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setError("");
    if (editingId) {
      setFormLoading(true);
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`/api/weight/${editingId}`, { method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ weightKg: Number(formWeight), date: formDate ? new Date(formDate) : new Date(), location: formLocation || undefined, notes: formNotes.trim() || "" }) });
        if (!res.ok) throw new Error("Failed to update");
        setSuccess("Updated!"); setShowForm(false); resetForm(); fetchAll(); setTimeout(() => setSuccess(""), 3000);
      } catch (err) { setError(err.message); } finally { setFormLoading(false); }
      return;
    }
    if (!formAnimalId) { setError("Select an animal."); return; }
    if (!formWeight) { setError("Weight is required."); return; }
    setFormLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/weight", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ animalId: formAnimalId, weightData: { date: formDate ? new Date(formDate) : new Date(), weightKg: Number(formWeight), location: formLocation || undefined, notes: formNotes.trim() || undefined } }) });
      if (!res.ok) throw new Error((await res.json())?.error || "Failed to save");
      // Update animal's currentWeight in the global cache immediately
      updateAnimalInCache(formAnimalId, { currentWeight: Number(formWeight), weightDate: formDate ? new Date(formDate) : new Date() });
      setSuccess("Weight recorded!"); setShowForm(false); resetForm(); fetchAll(); setTimeout(() => setSuccess(""), 3000);
    } catch (err) { setError(err.message); } finally { setFormLoading(false); }
  };

  if (loading) return <Loader />;

  return (
    <div className="space-y-6">
      <PageHeader title="Weight Tracking" subtitle="Monitor and compare animal weight progression" icon="⚖️"
        actions={<button onClick={() => { setShowForm(!showForm); setError(""); resetForm(); }} className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium">{showForm ? <FaTimes /> : <FaPlus />} {showForm ? "Cancel" : "Record Weight"}</button>}
      />

      {error && <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="error-message flex items-center justify-between"><span>{error}</span><button onClick={() => setError("")} className="text-red-500 hover:text-red-700"><FaTimes /></button></motion.div>}
      {success && <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="success-message"><FaCheck className="inline mr-2" />{success}</motion.div>}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[{ label: "Avg Weight", value: `${avgWeight} kg`, color: "purple" }, { label: "Total Records", value: totalRecords, color: "blue" }, { label: "Gaining", value: gainers, color: "green" }, { label: "Losing", value: losers, color: "red" }].map((s) => (
          <div key={s.label} className={`bg-${s.color}-50 border border-${s.color}-200 rounded-xl p-4`}><p className="text-sm text-gray-600">{s.label}</p><p className="text-2xl font-bold text-gray-900">{s.value}</p></div>
        ))}
      </div>

      {showForm && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 overflow-hidden">
          <div className="bg-purple-600 px-6 py-3"><h3 className="text-lg font-bold text-white">{editingId ? "Edit Weight Record" : "Record Weight"}</h3></div>
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4">
              <h4 className="font-bold text-purple-900 mb-3 flex items-center gap-2">⚖️ Weight Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div><label className="label">Animal *</label><select value={formAnimalId} onChange={(e) => setFormAnimalId(e.target.value)} className="input-field" required disabled={!!editingId}><option value="">-- Select Animal --</option>{aliveAnimals.map((a) => <option key={a._id} value={a._id}>{a.name ? `${a.name} (${a.tagId})` : a.tagId} — {a.currentWeight || "?"}kg</option>)}</select></div>
                <div><label className="label">Date</label><input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} className="input-field" /></div>
                <div><label className="label">Weight (kg) *</label><input type="number" step="0.1" min="0" value={formWeight} onChange={(e) => setFormWeight(e.target.value)} placeholder="e.g., 42.5" className="input-field" required /></div>
                <div><label className="label">Location</label><select value={formLocation} onChange={(e) => setFormLocation(e.target.value)} className="input-field"><option value="">-- Select Location --</option>{locations.map((loc) => <option key={loc._id} value={loc._id}>{loc.name}</option>)}</select></div>
                <div className="md:col-span-2"><label className="label">Notes</label><input type="text" value={formNotes} onChange={(e) => setFormNotes(e.target.value)} placeholder="Optional notes" className="input-field" /></div>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2 border-t">
              <button type="button" onClick={() => { setShowForm(false); resetForm(); }} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Cancel</button>
              <button type="submit" disabled={formLoading} className="flex items-center gap-2 px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium disabled:opacity-60">{formLoading ? <FaSpinner className="animate-spin" /> : <FaCheck />} {editingId ? "Update" : "Save Weight"}</button>
            </div>
          </form>
        </motion.div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button onClick={() => { setViewMode("overview"); setHistoryAnimalId(""); }} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${viewMode === "overview" ? "bg-purple-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>All Animals</button>
        <button onClick={() => { setViewMode("history"); if (!historyAnimalId) setHistoryAnimalId("all"); }} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${viewMode === "history" ? "bg-purple-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>Weight History</button>
      </div>

      <FilterBar searchTerm={searchTerm} onSearchChange={setSearchTerm} placeholder="Search by name, tag, or breed..."
        filters={[
          { value: filterPeriod, onChange: setFilterPeriod, options: PERIOD_OPTIONS },
          { value: filterLocation, onChange: setFilterLocation, options: [{ value: "all", label: "All Locations" }, ...locations.map((l) => ({ value: l._id, label: l.name }))] },
        ]}
      />

      {viewMode === "overview" ? (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          {filtered.length === 0 ? (
            <div className="text-center py-16"><span className="text-5xl mb-4 block">⚖️</span><p className="text-gray-500 text-lg">No animals found</p></div>
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
                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-900 uppercase">Change</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-900 uppercase">Proj. Max</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-900 uppercase">% of Max</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-900 uppercase">Records</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-900 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filtered.map((animal, idx) => (
                    <motion.tr key={animal._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.02 }} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900">{animal.name || "—"}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{animal.tagId}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{animal.breed || "—"}</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-700">{animal.birthWeight ? `${animal.birthWeight} kg` : "—"}</td>
                      <td className="px-4 py-3 text-sm text-right font-bold text-gray-900">{animal.currentWeight ? `${animal.currentWeight} kg` : "—"}</td>
                      <td className="px-4 py-3 text-sm text-center">
                        {animal.change !== null ? (
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${animal.change > 0 ? "bg-green-100 text-green-800" : animal.change < 0 ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-800"}`}>
                            {animal.change > 0 ? <FaArrowUp size={10} /> : animal.change < 0 ? <FaArrowDown size={10} /> : <FaMinus size={10} />}
                            {Math.abs(animal.change)} kg ({Math.abs(animal.changePercent)}%)
                          </span>
                        ) : "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-700">{animal.projectedMax ? `${animal.projectedMax} kg` : "—"}</td>
                      <td className="px-4 py-3 text-sm text-center">
                        {animal.projectedPct !== null ? (
                          <div className="flex items-center gap-2"><div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[80px]"><div className={`h-2 rounded-full ${animal.projectedPct >= 100 ? 'bg-green-500' : animal.projectedPct >= 75 ? 'bg-blue-500' : 'bg-purple-500'}`} style={{ width: `${Math.min(animal.projectedPct, 100)}%` }} /></div><span className="text-xs font-semibold">{animal.projectedPct}%</span></div>
                        ) : "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-center text-gray-700">{animal.recordCount}</td>
                      <td className="px-4 py-3 text-sm text-center">
                        <button onClick={() => { setHistoryAnimalId(animal._id); setViewMode("history"); }} className="text-purple-600 hover:text-purple-800 font-medium text-xs underline">History</button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow border border-gray-200 p-4 flex flex-col md:flex-row md:items-center gap-4">
            <label className="label mb-0">Select Animal:</label>
            <select value={historyAnimalId} onChange={(e) => setHistoryAnimalId(e.target.value)} className="input-field md:w-80">
              <option value="all">All Animals</option>
              {aliveAnimals.map((a) => <option key={a._id} value={a._id}>{a.name ? `${a.name} (${a.tagId})` : a.tagId} — {a.currentWeight || "?"}kg</option>)}
            </select>
            {historyAnimal && historyAnimalId !== "all" && (
              <div className="flex gap-4 text-sm text-gray-600">
                <span>Birth: <strong>{historyAnimal.birthWeight || "?"} kg</strong></span>
                <span>Current: <strong>{historyAnimal.currentWeight || "?"} kg</strong></span>
                <span>Proj. Max: <strong>{historyAnimal.projectedMaxWeight || "?"} kg</strong></span>
              </div>
            )}
            {historyAnimalId === "all" && (
              <span className="text-sm text-purple-600 font-medium">{historyRecords.length} total records</span>
            )}
          </div>
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            {historyRecords.length === 0 ? (
              <div className="text-center py-16"><span className="text-5xl mb-4 block">📊</span><p className="text-gray-500 text-lg">No records found</p></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b-2 border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-900 uppercase">#</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-900 uppercase">Date</th>
                      {(historyAnimalId === "all") && <th className="px-4 py-3 text-left text-xs font-bold text-gray-900 uppercase">Animal</th>}
                      <th className="px-4 py-3 text-right text-xs font-bold text-gray-900 uppercase">Weight (kg)</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-gray-900 uppercase">Change</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-900 uppercase">Location</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-900 uppercase">Notes</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-gray-900 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {historyRecords.map((record, idx) => {
                      const prev = historyAnimalId !== "all" ? historyRecords[idx + 1] : null;
                      const diff = prev ? +(record.weightKg - prev.weightKg).toFixed(2) : null;
                      const animalInfo = historyAnimalId === "all" ? animals.find(a => a._id === (record.animal?._id || record.animal)) : null;
                      return (
                        <motion.tr key={record._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.03 }} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 text-sm text-gray-500">{historyRecords.length - idx}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{record.date ? new Date(record.date).toLocaleDateString() : "—"}</td>
                          {historyAnimalId === "all" && <td className="px-4 py-3 text-sm font-semibold text-gray-900">{record.animal?.name || animalInfo?.name || record.animal?.tagId || animalInfo?.tagId || "—"}</td>}
                          <td className="px-4 py-3 text-sm text-right font-bold text-gray-900">{record.weightKg} kg</td>
                          <td className="px-4 py-3 text-sm text-center">
                            {diff !== null ? (
                              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${diff > 0 ? "bg-green-100 text-green-800" : diff < 0 ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-800"}`}>
                                {diff > 0 ? <FaArrowUp size={10} /> : diff < 0 ? <FaArrowDown size={10} /> : <FaMinus size={10} />}
                                {diff > 0 ? "+" : ""}{diff} kg
                              </span>
                            ) : <span className="text-gray-400 text-xs">{historyAnimalId === "all" ? "—" : "First"}</span>}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">{record.location?.name || "—"}</td>
                          <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">{record.notes || "—"}</td>
                          <td className="px-4 py-3 text-sm text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button onClick={() => handleEdit(record)} className="p-1.5 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-lg" title="Edit"><FaEdit size={13} /></button>
                              <button onClick={() => handleDelete(record._id)} className="p-1.5 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg" title="Delete"><FaTrash size={13} /></button>
                            </div>
                          </td>
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
