"use client";

import { useState, useEffect, useContext } from "react";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "framer-motion";
import { FaPlus, FaTimes, FaSpinner, FaCheck, FaStethoscope, FaSearch, FaEdit, FaTrash } from "react-icons/fa";
import PageHeader from "@/components/shared/PageHeader";
import StatsSummary from "@/components/shared/StatsSummary";
import FilterBar from "@/components/shared/FilterBar";
import Loader from "@/components/Loader";
import { BusinessContext } from "@/context/BusinessContext";
import { useRole } from "@/hooks/useRole";
import { PERIOD_OPTIONS, filterByPeriod, filterByLocation } from "@/utils/filterHelpers";
import { useAnimalData } from "@/context/AnimalDataContext";

const RECOVERY_STATUS = ["Under Treatment", "Improving", "Recovered", "Deteriorating", "Chronic", "Deceased"];
const TREATMENT_TYPES = ["Injection", "Oral", "Topical", "IV Drip", "Surgical", "Vaccination", "Deworming", "Other"];
const ROUTES = ["IM (Intramuscular)", "SC (Subcutaneous)", "IV (Intravenous)", "Oral", "Topical", "Nasal", "Rectal", "Other"];

const emptyForm = {
  animal: "",
  date: new Date().toISOString().split("T")[0],
  time: "",
  isRoutine: false,
  symptoms: "",
  possibleCause: "",
  diagnosis: "",
  prescribedDays: "",
  duration: "",
  preWeight: "",
  vaccines: "",
  location: "",
  treatmentA: { treatmentType: "", medication: "", dosage: "", route: "" },
  needsMultipleTreatments: false,
  treatmentB: { treatmentType: "", medication: "", dosage: "", route: "" },
  treatedBy: "",
  postObservation: "",
  observationTime: "",
  completionDate: "",
  recoveryStatus: "",
  postWeight: "",
  notes: "",
};

export default function HealthRecords() {
  const router = useRouter();
  const { businessSettings } = useContext(BusinessContext);
  const { user } = useRole();
  const { animals: globalAnimals, fetchAnimals: fetchGlobalAnimals } = useAnimalData();
  const [records, setRecords] = useState([]);
  const [animals, setAnimals] = useState([]);
  const [medications, setMedications] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPeriod, setFilterPeriod] = useState("all");
  const [filterLocation, setFilterLocation] = useState("all");
  const [formData, setFormData] = useState({ ...emptyForm });
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [viewRecord, setViewRecord] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }
    fetchAll();
  }, [router]);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      // Animals from global context; fetch rest in parallel
      const [animalsData, rRes, mRes, lRes] = await Promise.all([
        fetchGlobalAnimals(),
        fetch("/api/health-records", { headers }),
        fetch("/api/inventory", { headers }),
        fetch("/api/locations", { headers }),
      ]);
      const [rData, mData, lData] = await Promise.all([rRes.json(), mRes.json(), lRes.json()]);
      setRecords(Array.isArray(rData) ? rData : []);
      setAnimals(Array.isArray(animalsData) ? animalsData : []);
      const meds = (Array.isArray(mData) ? mData : []).filter(i =>
        ["medication", "medications", "medical supplies"].includes((i.categoryName || i.category || "").toLowerCase())
      );
      setMedications(meds);
      setLocations(Array.isArray(lData) ? lData : []);
    } catch (err) {
      console.error("Failed to fetch:", err);
    } finally {
      setLoading(false);
    }
  };

  const selectedAnimal = animals.find(a => a._id === formData.animal);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleTreatmentChange = (which, field, value) => {
    setFormData(prev => ({
      ...prev,
      [which]: { ...prev[which], [field]: value },
    }));
  };

  const handleEdit = (record) => {
    setEditId(record._id);
    setFormData({
      animal: record.animal?._id || record.animal || "",
      date: record.date ? new Date(record.date).toISOString().split("T")[0] : "",
      time: record.time || "",
      isRoutine: record.isRoutine || false,
      symptoms: record.symptoms || "",
      possibleCause: record.possibleCause || "",
      diagnosis: record.diagnosis || "",
      prescribedDays: record.prescribedDays || "",
      duration: record.duration || "",
      preWeight: record.preWeight || "",
      vaccines: record.vaccines || "",
      location: record.location?._id || record.location || "",
      treatmentA: {
        treatmentType: record.treatmentA?.treatmentType || "",
        medication: record.treatmentA?.medication?._id || record.treatmentA?.medication || "",
        dosage: record.treatmentA?.dosage || "",
        route: record.treatmentA?.route || "",
      },
      needsMultipleTreatments: record.needsMultipleTreatments || false,
      treatmentB: {
        treatmentType: record.treatmentB?.treatmentType || "",
        medication: record.treatmentB?.medication?._id || record.treatmentB?.medication || "",
        dosage: record.treatmentB?.dosage || "",
        route: record.treatmentB?.route || "",
      },
      treatedBy: record.treatedBy || "",
      postObservation: record.postObservation || "",
      observationTime: record.observationTime || "",
      completionDate: record.completionDate ? new Date(record.completionDate).toISOString().split("T")[0] : "",
      recoveryStatus: record.recoveryStatus || "",
      postWeight: record.postWeight || "",
      notes: record.notes || "",
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (!formData.animal || !formData.date) {
      setError("Animal and Date are required.");
      return;
    }
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const url = editId ? `/api/health-records/${editId}` : "/api/health-records";
      const method = editId ? "PUT" : "POST";
      const payload = { ...formData };
      if (!payload.treatmentA.treatmentType && !payload.treatmentA.medication) {
        payload.treatmentA = undefined;
      }
      if (!payload.needsMultipleTreatments || (!payload.treatmentB.treatmentType && !payload.treatmentB.medication)) {
        payload.treatmentB = undefined;
      }
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to save");
      }
      setSuccess(editId ? "Record updated!" : "Health record created!");
      setFormData({ ...emptyForm });
      setEditId(null);
      setShowForm(false);
      fetchAll();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this health record?")) return;
    try {
      const token = localStorage.getItem("token");
      await fetch(`/api/health-records/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchAll();
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const filtered = filterByLocation(filterByPeriod(records.filter(r => {
    const matchSearch = !searchTerm ||
      (r.animalTagId || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.diagnosis || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.symptoms || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.treatedBy || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchFilter = filterStatus === "all" || r.recoveryStatus === filterStatus;
    return matchSearch && matchFilter;
  }), filterPeriod), filterLocation);

  const stats = {
    total: records.length,
    underTreatment: records.filter(r => r.recoveryStatus === "Under Treatment").length,
    improving: records.filter(r => r.recoveryStatus === "Improving").length,
    healthy: records.filter(r => r.recoveryStatus === "Healthy").length,
  };

  const getMedName = (med) => {
    if (!med) return "—";
    if (typeof med === "object") return med.name || med.item || "—";
    const found = medications.find(m => m._id === med);
    return found ? (found.name || found.item) : "—";
  };

  return (
    <div className="space-y-8">
      <PageHeader title="Health Records" subtitle="Comprehensive health & treatment tracking for all animals" gradient="from-teal-600 to-teal-700" icon="🏥" />

      <StatsSummary stats={[
        { label: "Total Records", value: stats.total, bgColor: "bg-gray-50", borderColor: "border-gray-200", textColor: "text-gray-900", icon: "📋" },
        { label: "Under Treatment", value: stats.underTreatment, bgColor: "bg-red-50", borderColor: "border-red-200", textColor: "text-red-700", icon: "💊" },
        { label: "Improving", value: stats.improving, bgColor: "bg-blue-50", borderColor: "border-blue-200", textColor: "text-blue-700", icon: "📈" },
        { label: "Recovered", value: stats.recovered, bgColor: "bg-green-50", borderColor: "border-green-200", textColor: "text-green-700", icon: "✅" },
      ]} />

      {/* Controls */}
      <FilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        placeholder="Search by tag, diagnosis, symptoms..."
        filters={[
          { value: filterPeriod, onChange: setFilterPeriod, options: PERIOD_OPTIONS },
          { value: filterLocation, onChange: setFilterLocation, options: [{ value: "all", label: "All Locations" }, ...locations.map((l) => ({ value: l._id, label: l.name }))] },
          { value: filterStatus, onChange: setFilterStatus, options: [{ value: "all", label: "All Status" }, ...RECOVERY_STATUS.map((s) => ({ value: s, label: s }))] },
        ]}
        showAddButton={true}
        onAddClick={() => { setShowForm(!showForm); setEditId(null); setFormData({ ...emptyForm }); }}
        isAddActive={showForm}
        addLabel={showForm ? "Cancel" : "New Health Record"}
      />

      {error && <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg font-semibold">⚠️ {error}</div>}
      {success && <div className="bg-green-50 border-l-4 border-green-500 text-green-700 px-4 py-3 rounded-lg font-semibold">✅ {success}</div>}

      {/* Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-teal-600 to-teal-700 px-6 py-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <FaStethoscope /> {editId ? "Edit Health Record" : "New Health Record"}
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Section 1: Animal Info */}
              <div className="border-b border-gray-100 pb-6">
                <h4 className="text-sm font-bold text-teal-700 uppercase tracking-wider mb-4">🐐 Animal Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-2">
                    <label className="text-sm font-semibold text-gray-700 mb-1 block">Animal *</label>
                    <select value={formData.animal} onChange={(e) => handleChange("animal", e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-teal-500" required>
                      <option value="">Select animal...</option>
                      {animals.filter(a => a.status === "Alive").map(a => (
                        <option key={a._id} value={a._id}>{a.tagId} — {a.name} ({a.breed}, {a.gender})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-1 block">Date *</label>
                    <input type="date" value={formData.date} onChange={(e) => handleChange("date", e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-teal-500" required />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-1 block">Time</label>
                    <input type="time" value={formData.time} onChange={(e) => handleChange("time", e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-teal-500" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-1 block">Location</label>
                    <select value={formData.location} onChange={(e) => handleChange("location", e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-teal-500">
                      <option value="">Select location...</option>
                      {locations.map(l => <option key={l._id} value={l._id}>{l.name}</option>)}
                    </select>
                  </div>
                </div>
                {selectedAnimal && (
                  <div className="mt-3 p-3 bg-teal-50 rounded-lg text-sm text-teal-800 grid grid-cols-2 md:grid-cols-4 gap-2">
                    <span><b>Tag:</b> {selectedAnimal.tagId}</span>
                    <span><b>Gender:</b> {selectedAnimal.gender}</span>
                    <span><b>Breed:</b> {selectedAnimal.breed}</span>
                    <span><b>Weight:</b> {selectedAnimal.currentWeight || "—"} kg</span>
                  </div>
                )}
              </div>

              {/* Section 2: Diagnosis */}
              <div className="border-b border-gray-100 pb-6">
                <h4 className="text-sm font-bold text-teal-700 uppercase tracking-wider mb-4">🔍 Diagnosis & Symptoms</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <label className="text-sm font-semibold text-gray-700">Routine Check?</label>
                    <input type="checkbox" checked={formData.isRoutine} onChange={(e) => handleChange("isRoutine", e.target.checked)}
                      className="w-5 h-5 text-teal-600 rounded" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-1 block">Vaccines</label>
                    <input type="text" value={formData.vaccines} onChange={(e) => handleChange("vaccines", e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-teal-500" placeholder="e.g., PPR, CCPP" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-1 block">Symptoms</label>
                    <textarea rows={2} value={formData.symptoms} onChange={(e) => handleChange("symptoms", e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-teal-500" placeholder="Observed symptoms..." />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-1 block">Possible Cause</label>
                    <input type="text" value={formData.possibleCause} onChange={(e) => handleChange("possibleCause", e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-teal-500" placeholder="e.g., Bacterial infection" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-1 block">Diagnosis</label>
                    <input type="text" value={formData.diagnosis} onChange={(e) => handleChange("diagnosis", e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-teal-500" placeholder="e.g., Pneumonia" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-1 block">Prescribed Days</label>
                    <input type="number" value={formData.prescribedDays} onChange={(e) => handleChange("prescribedDays", e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-teal-500" placeholder="e.g., 5" min="0" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-1 block">Duration</label>
                    <input type="text" value={formData.duration} onChange={(e) => handleChange("duration", e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-teal-500" placeholder="e.g., 5 days, 2 weeks" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-1 block">Pre-Treatment Weight (kg)</label>
                    <input type="number" value={formData.preWeight} onChange={(e) => handleChange("preWeight", e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-teal-500" placeholder="0" min="0" step="0.1" />
                  </div>
                </div>
              </div>

              {/* Section 3: Treatment A */}
              <div className="border-b border-gray-100 pb-6">
                <h4 className="text-sm font-bold text-teal-700 uppercase tracking-wider mb-4">💊 Treatment A</h4>
                <TreatmentFields which="treatmentA" data={formData.treatmentA} onChange={handleTreatmentChange} medications={medications} />
              </div>

              {/* Multiple Treatments Toggle */}
              <div className="flex items-center gap-3 pb-2">
                <input type="checkbox" checked={formData.needsMultipleTreatments} onChange={(e) => handleChange("needsMultipleTreatments", e.target.checked)}
                  className="w-5 h-5 text-teal-600 rounded" id="multiTreatment" />
                <label htmlFor="multiTreatment" className="text-sm font-semibold text-gray-700">Add Treatment B (multiple medications)</label>
              </div>

              {/* Section 4: Treatment B */}
              <AnimatePresence>
                {formData.needsMultipleTreatments && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                    className="border-b border-gray-100 pb-6">
                    <h4 className="text-sm font-bold text-orange-700 uppercase tracking-wider mb-4">💊 Treatment B</h4>
                    <TreatmentFields which="treatmentB" data={formData.treatmentB} onChange={handleTreatmentChange} medications={medications} />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Section 5: Post-Treatment */}
              <div className="border-b border-gray-100 pb-6">
                <h4 className="text-sm font-bold text-teal-700 uppercase tracking-wider mb-4">📋 Post-Treatment & Follow-up</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-1 block">Treated By</label>
                    <input type="text" value={formData.treatedBy} onChange={(e) => handleChange("treatedBy", e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-teal-500" placeholder="Vet or staff name" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-1 block">Observation Time</label>
                    <input type="text" value={formData.observationTime} onChange={(e) => handleChange("observationTime", e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-teal-500" placeholder="e.g., 2 hours post" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-1 block">Recovery Status</label>
                    <select value={formData.recoveryStatus} onChange={(e) => handleChange("recoveryStatus", e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-teal-500">
                      <option value="">Select...</option>
                      {RECOVERY_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-1 block">Completion Date</label>
                    <input type="date" value={formData.completionDate} onChange={(e) => handleChange("completionDate", e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-teal-500" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-1 block">Post-Treatment Weight (kg)</label>
                    <input type="number" value={formData.postWeight} onChange={(e) => handleChange("postWeight", e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-teal-500" placeholder="0" min="0" step="0.1" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-1 block">Post Observation</label>
                    <input type="text" value={formData.postObservation} onChange={(e) => handleChange("postObservation", e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-teal-500" placeholder="Observations after treatment" />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1 block">Notes / Treatment Plan Summary</label>
                <textarea rows={3} value={formData.notes} onChange={(e) => handleChange("notes", e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-teal-500" placeholder="Additional notes..." />
              </div>

              <motion.button type="submit" disabled={saving} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                className="w-full py-4 bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-xl font-bold shadow-lg flex items-center justify-center gap-2">
                {saving ? <><FaSpinner className="animate-spin" /> Saving...</> : <><FaCheck /> {editId ? "Update Record" : "Save Health Record"}</>}
              </motion.button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* View Record Modal */}
      <AnimatePresence>
        {viewRecord && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setViewRecord(null)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="bg-gradient-to-r from-teal-600 to-teal-700 px-6 py-4 flex items-center justify-between rounded-t-2xl">
                <h3 className="text-lg font-bold text-white">Health Record Detail</h3>
                <button onClick={() => setViewRecord(null)} className="text-white hover:text-teal-200"><FaTimes /></button>
              </div>
              <div className="p-6 space-y-4 text-sm">
                <DetailRow label="Animal" value={`${viewRecord.animalTagId || "—"} (${viewRecord.animalGender || "—"}, ${viewRecord.animalBreed || "—"})`} />
                <DetailRow label="Date / Time" value={`${viewRecord.date ? new Date(viewRecord.date).toLocaleDateString() : "—"} ${viewRecord.time || ""}`} />
                <DetailRow label="Routine" value={viewRecord.isRoutine ? "Yes" : "No"} />
                <DetailRow label="Symptoms" value={viewRecord.symptoms} />
                <DetailRow label="Possible Cause" value={viewRecord.possibleCause} />
                <DetailRow label="Diagnosis" value={viewRecord.diagnosis} />
                <DetailRow label="Prescribed Days" value={viewRecord.prescribedDays} />
                <DetailRow label="Pre-Weight" value={viewRecord.preWeight ? `${viewRecord.preWeight} kg` : "—"} />
                <DetailRow label="Vaccines" value={viewRecord.vaccines} />
                <div className="bg-teal-50 p-3 rounded-lg">
                  <b className="text-teal-700">Treatment A:</b>
                  <span className="ml-2">{viewRecord.treatmentA?.treatmentType || "—"} | {getMedName(viewRecord.treatmentA?.medication)} | {viewRecord.treatmentA?.dosage || "—"} | {viewRecord.treatmentA?.route || "—"}</span>
                </div>
                {viewRecord.needsMultipleTreatments && viewRecord.treatmentB && (
                  <div className="bg-orange-50 p-3 rounded-lg">
                    <b className="text-orange-700">Treatment B:</b>
                    <span className="ml-2">{viewRecord.treatmentB?.treatmentType || "—"} | {getMedName(viewRecord.treatmentB?.medication)} | {viewRecord.treatmentB?.dosage || "—"} | {viewRecord.treatmentB?.route || "—"}</span>
                  </div>
                )}
                <DetailRow label="Treated By" value={viewRecord.treatedBy} />
                <DetailRow label="Post Observation" value={viewRecord.postObservation} />
                <DetailRow label="Recovery Status" value={viewRecord.recoveryStatus} />
                <DetailRow label="Post-Weight" value={viewRecord.postWeight ? `${viewRecord.postWeight} kg` : "—"} />
                <DetailRow label="Completion Date" value={viewRecord.completionDate ? new Date(viewRecord.completionDate).toLocaleDateString() : "—"} />
                <DetailRow label="Notes" value={viewRecord.notes} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Records Table */}
      {loading ? (
        <Loader message="Loading health records..." color="teal-600" />
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
          <div className="text-6xl mb-4">🏥</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No Health Records</h3>
          <p className="text-gray-600">{searchTerm ? "No matches found." : "Start by adding a health record."}</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700">Animal</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700">Diagnosis</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700">Treatment A</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700">Treated By</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, idx) => (
                  <motion.tr key={r._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.02 }} className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                    onClick={() => setViewRecord(r)}>
                    <td className="px-4 py-3 text-sm">{r.date ? new Date(r.date).toLocaleDateString() : "—"}</td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-sm">{r.animalTagId || "—"}</div>
                      <div className="text-xs text-gray-500">{r.animalGender} • {r.animalBreed}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 max-w-[180px] truncate">{r.diagnosis || r.symptoms || "—"}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      <div>{r.treatmentA?.treatmentType || "—"}</div>
                      <div className="text-xs text-gray-500">{getMedName(r.treatmentA?.medication)}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{r.treatedBy || "—"}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={r.recoveryStatus} />
                    </td>
                    <td className="px-4 py-3 text-center" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => handleEdit(r)} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-bold hover:bg-blue-200"><FaEdit /></button>
                        <button onClick={() => handleDelete(r._id)} className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-bold hover:bg-red-200"><FaTrash /></button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function TreatmentFields({ which, data, onChange, medications }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div>
        <label className="text-sm font-semibold text-gray-700 mb-1 block">Type</label>
        <select value={data.treatmentType} onChange={(e) => onChange(which, "treatmentType", e.target.value)}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-teal-500">
          <option value="">Select type...</option>
          {TREATMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      <div>
        <label className="text-sm font-semibold text-gray-700 mb-1 block">Medication (from Inventory)</label>
        <select value={data.medication} onChange={(e) => onChange(which, "medication", e.target.value)}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-teal-500">
          <option value="">Select medication...</option>
          {medications.map(m => (
            <option key={m._id} value={m._id}>{m.name || m.item} ({m.quantity} {m.unit || "units"})</option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-sm font-semibold text-gray-700 mb-1 block">Dosage</label>
        <input type="text" value={data.dosage} onChange={(e) => onChange(which, "dosage", e.target.value)}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-teal-500" placeholder="e.g., 2ml" />
      </div>
      <div>
        <label className="text-sm font-semibold text-gray-700 mb-1 block">Route</label>
        <select value={data.route} onChange={(e) => onChange(which, "route", e.target.value)}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-teal-500">
          <option value="">Select route...</option>
          {ROUTES.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const colors = {
    "Under Treatment": "bg-red-100 text-red-800",
    "Improving": "bg-blue-100 text-blue-800",
    "Recovered": "bg-green-100 text-green-800",
    "Deteriorating": "bg-orange-100 text-orange-800",
    "Chronic": "bg-purple-100 text-purple-800",
    "Deceased": "bg-gray-100 text-gray-800",
  };
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-bold ${colors[status] || "bg-gray-100 text-gray-600"}`}>
      {status || "—"}
    </span>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="flex gap-2">
      <span className="font-semibold text-gray-600 w-40 flex-shrink-0">{label}:</span>
      <span className="text-gray-900">{value || "—"}</span>
    </div>
  );
}

HealthRecords.layoutType = "default";
HealthRecords.layoutProps = { title: "Health Records" };
