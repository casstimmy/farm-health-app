"use client";

import { useState, useEffect, useContext, useMemo } from "react";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaPlus, FaTimes, FaSpinner, FaCheck, FaStethoscope, FaSearch, FaEdit, FaTrash,
  FaList, FaPaw, FaCalendarAlt, FaChevronDown, FaChevronUp, FaSyringe, FaBug, FaHeartbeat,
  FaExclamationTriangle, FaNotesMedical, FaClipboardCheck, FaBell
} from "react-icons/fa";
import PageHeader from "@/components/shared/PageHeader";
import StatsSummary from "@/components/shared/StatsSummary";
import FilterBar from "@/components/shared/FilterBar";
import Loader from "@/components/Loader";
import { BusinessContext } from "@/context/BusinessContext";
import { useRole } from "@/hooks/useRole";
import { PERIOD_OPTIONS, filterByPeriod, filterByLocation } from "@/utils/filterHelpers";
import { useAnimalData } from "@/context/AnimalDataContext";
import { formatCurrency } from "@/utils/formatting";

const RECOVERY_STATUS = ["Under Treatment", "Improving", "Recovered", "Deteriorating", "Chronic", "Deceased"];
const TREATMENT_TYPES = ["Antibiotics", "Ext-Parasite", "Deworming", "Vitamin Dosing", "Hydration/Electrolyte", "Vaccination", "Int-Parasite", "Injection", "Oral", "Topical", "IV Drip", "Surgical", "Other"];
const ROUTES = ["IM", "Oral", "Subcutaneous", "Spraying", "Backline", "Topical", "IV", "Other"];
const VIEW_MODES = [
  { key: "records", label: "All Records", icon: FaList },
  { key: "animals", label: "By Animal", icon: FaPaw },
  { key: "schedule", label: "Schedules", icon: FaCalendarAlt },
];

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
  treatmentA: { treatmentType: "", medication: "", medicationName: "", dosage: "", route: "" },
  needsMultipleTreatments: false,
  treatmentB: { treatmentType: "", medication: "", medicationName: "", dosage: "", route: "" },
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
  const [viewMode, setViewMode] = useState("records");
  const [expandedAnimal, setExpandedAnimal] = useState(null);
  // Group entry mode
  const [selectionMode, setSelectionMode] = useState("individual"); // individual | paddock | location
  const [selectedPaddock, setSelectedPaddock] = useState("");
  const [selectedGroupLocation, setSelectedGroupLocation] = useState("");
  const [selectedAnimals, setSelectedAnimals] = useState([]);
  const [deleting, setDeleting] = useState(null);

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
    setSelectionMode("individual");
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
        medicationName: record.treatmentA?.medicationName || "",
        dosage: record.treatmentA?.dosage || "",
        route: record.treatmentA?.route || "",
      },
      needsMultipleTreatments: record.needsMultipleTreatments || false,
      treatmentB: {
        treatmentType: record.treatmentB?.treatmentType || "",
        medication: record.treatmentB?.medication?._id || record.treatmentB?.medication || "",
        medicationName: record.treatmentB?.medicationName || "",
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

  // Build payload, stripping empty treatment objects
  const buildPayload = (data, animalId) => {
    const payload = { ...data, animal: animalId || data.animal };
    if (!payload.treatmentA?.treatmentType && !payload.treatmentA?.medication) {
      payload.treatmentA = undefined;
    }
    if (!payload.needsMultipleTreatments || (!payload.treatmentB?.treatmentType && !payload.treatmentB?.medication)) {
      payload.treatmentB = undefined;
    }
    return payload;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");

    // Determine animals list for submission
    let animalIds = [];
    if (selectionMode === "individual") {
      if (!formData.animal) { setError("Please select an animal."); return; }
      animalIds = [formData.animal];
    } else if (selectionMode === "paddock") {
      animalIds = selectedAnimals;
      if (animalIds.length === 0) { setError("No animals in selected paddock/shed."); return; }
    } else if (selectionMode === "location") {
      animalIds = selectedAnimals;
      if (animalIds.length === 0) { setError("No animals in selected location."); return; }
    }

    if (!formData.date) { setError("Date is required."); return; }
    setSaving(true);
    try {
      const token = localStorage.getItem("token");

      if (editId) {
        // Edit mode - single record
        const payload = buildPayload(formData);
        const res = await fetch(`/api/health-records/${editId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload),
        });
        if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Failed to update"); }
        setSuccess("Record updated!");
      } else {
        // Create mode - batch for group/paddock
        let created = 0;
        for (const aid of animalIds) {
          const payload = buildPayload(formData, aid);
          const res = await fetch("/api/health-records", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify(payload),
          });
          if (res.ok) created++;
        }
        setSuccess(`${created} health record${created > 1 ? "s" : ""} created!`);
      }

      setFormData({ ...emptyForm });
      setEditId(null);
      setShowForm(false);
      setSelectionMode("individual");
      setSelectedAnimals([]);
      fetchAll();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this health record?")) return;
    setDeleting(id);
    try {
      const token = localStorage.getItem("token");
      await fetch(`/api/health-records/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchAll();
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setDeleting(null);
    }
  };

  // Paddock list from animals
  const paddockList = useMemo(() => {
    const set = new Set();
    animals.forEach(a => { if (a.paddock) set.add(a.paddock); });
    return [...set].sort();
  }, [animals]);

  // Animals filtered by paddock or location for group mode
  useEffect(() => {
    if (selectionMode === "paddock" && selectedPaddock) {
      const ids = animals
        .filter(a => a.status === "Alive" && !a.isArchived && (a.paddock || "").toLowerCase() === selectedPaddock.toLowerCase())
        .map(a => a._id);
      setSelectedAnimals(ids);
    } else if (selectionMode === "location" && selectedGroupLocation) {
      const ids = animals
        .filter(a => a.status === "Alive" && !a.isArchived && (a.location === selectedGroupLocation || a.location?._id === selectedGroupLocation))
        .map(a => a._id);
      setSelectedAnimals(ids);
    } else if (selectionMode === "individual") {
      setSelectedAnimals([]);
    }
  }, [selectionMode, selectedPaddock, selectedGroupLocation, animals]);

  // Filter logic
  const filtered = useMemo(() => {
    let result = records.filter(r => {
      const matchSearch = !searchTerm ||
        (r.animalTagId || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.diagnosis || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.symptoms || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.treatedBy || "").toLowerCase().includes(searchTerm.toLowerCase());
      const matchFilter = filterStatus === "all" || r.recoveryStatus === filterStatus;
      return matchSearch && matchFilter;
    });
    result = filterByPeriod(result, filterPeriod);
    result = filterByLocation(result, filterLocation);
    return result;
  }, [records, searchTerm, filterStatus, filterPeriod, filterLocation]);

  // Stats
  const stats = useMemo(() => ({
    total: records.length,
    underTreatment: records.filter(r => r.recoveryStatus === "Under Treatment").length,
    improving: records.filter(r => r.recoveryStatus === "Improving").length,
    recovered: records.filter(r => r.recoveryStatus === "Recovered").length,
  }), [records]);

  // Group records by animal for "By Animal" view
  const animalHealthMap = useMemo(() => {
    const map = {};
    // Init all alive animals
    animals.filter(a => a.status === "Alive" && !a.isArchived).forEach(a => {
      map[a._id] = { animal: a, records: [], latestStatus: null, latestDate: null, totalMedCost: a.totalMedicationCost || 0 };
    });
    // Assign records
    records.forEach(r => {
      const aid = r.animal?._id || r.animal;
      if (!map[aid]) {
        // Animal might be sold/dead but has records
        const animalObj = animals.find(a => a._id === aid);
        if (animalObj) {
          map[aid] = { animal: animalObj, records: [], latestStatus: null, latestDate: null, totalMedCost: animalObj.totalMedicationCost || 0 };
        } else return;
      }
      map[aid].records.push(r);
    });
    // Sort records per animal and set latest
    Object.values(map).forEach(entry => {
      entry.records.sort((a, b) => new Date(b.date) - new Date(a.date));
      if (entry.records.length > 0) {
        entry.latestStatus = entry.records[0].recoveryStatus;
        entry.latestDate = entry.records[0].date;
      }
    });
    return map;
  }, [animals, records]);

  // Schedule: upcoming vaccination/deworming based on existing records
  const scheduleItems = useMemo(() => {
    const items = [];
    const now = new Date();
    records.forEach(r => {
      if (!r.prescribedDays || r.prescribedDays <= 0) return;
      const recDate = new Date(r.date);
      const nextDue = new Date(recDate);
      nextDue.setDate(nextDue.getDate() + r.prescribedDays);

      const treatType = r.treatmentA?.treatmentType || r.diagnosis || "Follow-up";
      const isVaccination = /vacc|deworm/i.test(treatType) || /vacc|deworm/i.test(r.vaccines || "");
      const animalObj = animals.find(a => a._id === (r.animal?._id || r.animal));

      items.push({
        animalTagId: r.animalTagId || animalObj?.tagId || "—",
        animalName: animalObj?.name || "",
        animalId: r.animal?._id || r.animal,
        type: isVaccination ? "Vaccination/Deworming" : treatType,
        lastDate: r.date,
        nextDue,
        isOverdue: nextDue < now,
        isDueSoon: nextDue >= now && nextDue <= new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        recoveryStatus: r.recoveryStatus,
        recordId: r._id,
      });
    });
    items.sort((a, b) => new Date(a.nextDue) - new Date(b.nextDue));
    return items;
  }, [records, animals]);

  const getMedName = (med) => {
    if (!med) return "—";
    if (typeof med === "object") return med.name || med.item || "—";
    const found = medications.find(m => m._id === med);
    return found ? (found.name || found.item) : "—";
  };

  const openForm = () => {
    setShowForm(true);
    setEditId(null);
    setFormData({ ...emptyForm });
    setSelectionMode("individual");
    setSelectedAnimals([]);
    setError("");
  };

  const closeForm = () => {
    setShowForm(false);
    setEditId(null);
    setSelectionMode("individual");
    setSelectedAnimals([]);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Health Records"
        subtitle="Comprehensive health & treatment tracking for all animals"
        gradient="from-teal-600 to-teal-700"
        icon="🏥"
        actions={
          <button
            onClick={() => showForm ? closeForm() : openForm()}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-lg ${
              showForm ? "bg-white/20 hover:bg-white/30 text-white" : "bg-white text-teal-700 hover:bg-teal-50"
            }`}
          >
            {showForm ? <FaTimes /> : <FaPlus />} {showForm ? "Cancel" : "New Health Record"}
          </button>
        }
      />

      <StatsSummary stats={[
        { label: "Total Records", value: stats.total, bgColor: "bg-gray-50", borderColor: "border-gray-200", textColor: "text-gray-900", icon: "📋" },
        { label: "Under Treatment", value: stats.underTreatment, bgColor: "bg-red-50", borderColor: "border-red-200", textColor: "text-red-700", icon: "💊" },
        { label: "Improving", value: stats.improving, bgColor: "bg-blue-50", borderColor: "border-blue-200", textColor: "text-blue-700", icon: "📈" },
        { label: "Recovered", value: stats.recovered, bgColor: "bg-green-50", borderColor: "border-green-200", textColor: "text-green-700", icon: "✅" },
      ]} />

      {error && <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg font-semibold flex items-center justify-between">
        <span>⚠️ {error}</span><button onClick={() => setError("")}><FaTimes /></button>
      </div>}
      {success && <div className="bg-green-50 border-l-4 border-green-500 text-green-700 px-4 py-3 rounded-lg font-semibold">✅ {success}</div>}

      {/* ─── Form ─── */}
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
              {/* Selection Mode */}
              {!editId && (
                <div className="bg-teal-50 border-2 border-teal-200 rounded-xl p-4">
                  <h4 className="text-sm font-bold text-teal-700 uppercase tracking-wider mb-3">🎯 Selection Mode</h4>
                  <div className="flex flex-wrap gap-3 mb-4">
                    {[
                      { key: "individual", label: "Individual Animal", icon: "🐐" },
                      { key: "paddock", label: "By Paddock/Shed", icon: "🏠" },
                      { key: "location", label: "By Location", icon: "📍" },
                    ].map(m => (
                      <button key={m.key} type="button"
                        onClick={() => { setSelectionMode(m.key); setSelectedAnimals([]); }}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all border-2 ${
                          selectionMode === m.key ? "bg-teal-600 text-white border-teal-600" : "bg-white text-gray-700 border-gray-200 hover:border-teal-400"
                        }`}
                      >
                        <span>{m.icon}</span> {m.label}
                      </button>
                    ))}
                  </div>
                  {selectionMode === "individual" && (
                    <div>
                      <label className="text-sm font-semibold text-gray-700 mb-1 block">Animal *</label>
                      <select value={formData.animal} onChange={(e) => handleChange("animal", e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-teal-500" required>
                        <option value="">Select animal...</option>
                        {animals.filter(a => a.status === "Alive" && !a.isArchived).map(a => (
                          <option key={a._id} value={a._id}>{a.tagId} — {a.name || ""} ({a.breed}, {a.gender})</option>
                        ))}
                      </select>
                    </div>
                  )}
                  {selectionMode === "paddock" && (
                    <div>
                      <label className="text-sm font-semibold text-gray-700 mb-1 block">Paddock/Shed *</label>
                      <select value={selectedPaddock} onChange={(e) => setSelectedPaddock(e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-teal-500">
                        <option value="">Select paddock...</option>
                        {paddockList.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                      {selectedAnimals.length > 0 && (
                        <p className="mt-2 text-sm text-teal-700 font-semibold">✅ {selectedAnimals.length} animal{selectedAnimals.length !== 1 ? "s" : ""} will receive this health record</p>
                      )}
                    </div>
                  )}
                  {selectionMode === "location" && (
                    <div>
                      <label className="text-sm font-semibold text-gray-700 mb-1 block">Location *</label>
                      <select value={selectedGroupLocation} onChange={(e) => setSelectedGroupLocation(e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-teal-500">
                        <option value="">Select location...</option>
                        {locations.map(l => <option key={l._id} value={l._id}>{l.name}</option>)}
                      </select>
                      {selectedAnimals.length > 0 && (
                        <p className="mt-2 text-sm text-teal-700 font-semibold">✅ {selectedAnimals.length} animal{selectedAnimals.length !== 1 ? "s" : ""} will receive this health record</p>
                      )}
                    </div>
                  )}
                  {selectedAnimal && selectionMode === "individual" && (
                    <div className="mt-3 p-3 bg-white rounded-lg text-sm text-teal-800 grid grid-cols-2 md:grid-cols-4 gap-2 border border-teal-200">
                      <span><b>Tag:</b> {selectedAnimal.tagId}</span>
                      <span><b>Gender:</b> {selectedAnimal.gender}</span>
                      <span><b>Breed:</b> {selectedAnimal.breed}</span>
                      <span><b>Weight:</b> {selectedAnimal.currentWeight || "—"} kg</span>
                    </div>
                  )}
                </div>
              )}

              {/* Edit mode: show animal dropdown */}
              {editId && (
                <div className="border-b border-gray-100 pb-4">
                  <h4 className="text-sm font-bold text-teal-700 uppercase tracking-wider mb-3">🐐 Animal</h4>
                  <select value={formData.animal} onChange={(e) => handleChange("animal", e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-teal-500" required>
                    <option value="">Select animal...</option>
                    {animals.filter(a => a.status === "Alive" && !a.isArchived).map(a => (
                      <option key={a._id} value={a._id}>{a.tagId} — {a.name || ""} ({a.breed}, {a.gender})</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Date, Time, Location row */}
              <div className="border-b border-gray-100 pb-6">
                <h4 className="text-sm font-bold text-teal-700 uppercase tracking-wider mb-4">📅 Record Info</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                  <div className="flex items-center gap-3 pt-7">
                    <input type="checkbox" checked={formData.isRoutine} onChange={(e) => handleChange("isRoutine", e.target.checked)}
                      className="w-5 h-5 text-teal-600 rounded" id="isRoutine" />
                    <label htmlFor="isRoutine" className="text-sm font-semibold text-gray-700">Routine Check</label>
                  </div>
                </div>
              </div>

              {/* Diagnosis & Symptoms */}
              <div className="border-b border-gray-100 pb-6">
                <h4 className="text-sm font-bold text-teal-700 uppercase tracking-wider mb-4">🔍 Diagnosis & Symptoms</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-1 block">Prescribed Days</label>
                    <input type="number" value={formData.prescribedDays} onChange={(e) => handleChange("prescribedDays", e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-teal-500" placeholder="e.g., 5" min="0" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-1 block">Duration</label>
                    <input type="text" value={formData.duration} onChange={(e) => handleChange("duration", e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-teal-500" placeholder="e.g., 5 days" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-1 block">Vaccines</label>
                    <input type="text" value={formData.vaccines} onChange={(e) => handleChange("vaccines", e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-teal-500" placeholder="e.g., PPR, CCPP" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-1 block">Pre-Weight (kg)</label>
                    <input type="number" value={formData.preWeight} onChange={(e) => handleChange("preWeight", e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-teal-500" placeholder="0" min="0" step="0.1" />
                  </div>
                </div>
              </div>

              {/* Treatment A */}
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

              {/* Treatment B */}
              <AnimatePresence>
                {formData.needsMultipleTreatments && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                    className="border-b border-gray-100 pb-6">
                    <h4 className="text-sm font-bold text-orange-700 uppercase tracking-wider mb-4">💊 Treatment B</h4>
                    <TreatmentFields which="treatmentB" data={formData.treatmentB} onChange={handleTreatmentChange} medications={medications} />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Post-Treatment & Follow-up */}
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
                    <label className="text-sm font-semibold text-gray-700 mb-1 block">Post-Weight (kg)</label>
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
                {saving ? <><FaSpinner className="animate-spin" /> Saving...</> : <><FaCheck /> {editId ? "Update Record" : `Save Health Record${selectedAnimals.length > 1 ? ` (${selectedAnimals.length} animals)` : ""}`}</>}
              </motion.button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── View Mode Tabs ─── */}
      <div className="flex gap-2 bg-white rounded-xl p-1.5 shadow-sm border border-gray-200 w-fit">
        {VIEW_MODES.map(m => {
          const Icon = m.icon;
          return (
            <button key={m.key} onClick={() => setViewMode(m.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                viewMode === m.key ? "bg-teal-600 text-white shadow-md" : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <Icon size={14} /> {m.label}
            </button>
          );
        })}
      </div>

      {/* ─── Filter Bar ─── */}
      <FilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        placeholder="Search by tag, diagnosis, symptoms..."
        filters={[
          { value: filterPeriod, onChange: setFilterPeriod, options: PERIOD_OPTIONS },
          { value: filterLocation, onChange: setFilterLocation, options: [{ value: "all", label: "All Locations" }, ...locations.map(l => ({ value: l._id, label: l.name }))] },
          { value: filterStatus, onChange: setFilterStatus, options: [{ value: "all", label: "All Status" }, ...RECOVERY_STATUS.map(s => ({ value: s, label: s }))] },
        ]}
      />

      {/* ─── Improved Detail Modal ─── */}
      <AnimatePresence>
        {viewRecord && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setViewRecord(null)}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              {/* Header */}
              <div className="bg-gradient-to-r from-teal-600 to-teal-700 px-6 py-5 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2"><FaNotesMedical /> Health Record Detail</h3>
                    <p className="text-teal-100 text-sm mt-1">
                      {viewRecord.animalTagId || "—"} • {viewRecord.date ? new Date(viewRecord.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"} {viewRecord.time || ""}
                    </p>
                  </div>
                  <button onClick={() => setViewRecord(null)} className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-lg p-2 transition"><FaTimes size={18} /></button>
                </div>
              </div>
              <div className="p-6 space-y-5">
                {/* Animal Info */}
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                  <h4 className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-3 flex items-center gap-2"><FaPaw /> Animal Information</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div><span className="text-gray-500 block text-xs">Tag ID</span><span className="font-bold text-gray-900">{viewRecord.animalTagId || "—"}</span></div>
                    <div><span className="text-gray-500 block text-xs">Gender</span><span className="font-semibold">{viewRecord.animalGender || "—"}</span></div>
                    <div><span className="text-gray-500 block text-xs">Breed</span><span className="font-semibold">{viewRecord.animalBreed || "—"}</span></div>
                    <div><span className="text-gray-500 block text-xs">Routine Check</span><span className="font-semibold">{viewRecord.isRoutine ? "✅ Yes" : "No"}</span></div>
                  </div>
                </div>

                {/* Diagnosis */}
                <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                  <h4 className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-3 flex items-center gap-2"><FaExclamationTriangle /> Diagnosis & Symptoms</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                    <div><span className="text-gray-500 block text-xs">Symptoms</span><span className="font-semibold text-gray-900">{viewRecord.symptoms || "—"}</span></div>
                    <div><span className="text-gray-500 block text-xs">Possible Cause</span><span className="font-semibold">{viewRecord.possibleCause || "—"}</span></div>
                    <div><span className="text-gray-500 block text-xs">Diagnosis</span><span className="font-bold text-amber-800">{viewRecord.diagnosis || "—"}</span></div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mt-3">
                    <div><span className="text-gray-500 block text-xs">Prescribed Days</span><span className="font-semibold">{viewRecord.prescribedDays || "—"}</span></div>
                    <div><span className="text-gray-500 block text-xs">Duration</span><span className="font-semibold">{viewRecord.duration || "—"}</span></div>
                    <div><span className="text-gray-500 block text-xs">Pre-Weight</span><span className="font-semibold">{viewRecord.preWeight ? `${viewRecord.preWeight} kg` : "—"}</span></div>
                    <div><span className="text-gray-500 block text-xs">Vaccines</span><span className="font-semibold">{viewRecord.vaccines || "—"}</span></div>
                  </div>
                </div>

                {/* Treatment A */}
                <div className="bg-teal-50 rounded-xl p-4 border border-teal-200">
                  <h4 className="text-xs font-bold text-teal-700 uppercase tracking-wider mb-3 flex items-center gap-2"><FaSyringe /> Treatment A</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div><span className="text-gray-500 block text-xs">Type</span><span className="font-semibold">{viewRecord.treatmentA?.treatmentType || "—"}</span></div>
                    <div><span className="text-gray-500 block text-xs">Medication</span><span className="font-Bold">{getMedName(viewRecord.treatmentA?.medication)}</span></div>
                    <div><span className="text-gray-500 block text-xs">Dosage</span><span className="font-semibold">{viewRecord.treatmentA?.dosage || "—"}</span></div>
                    <div><span className="text-gray-500 block text-xs">Route</span><span className="font-semibold">{viewRecord.treatmentA?.route || "—"}</span></div>
                  </div>
                </div>

                {/* Treatment B */}
                {viewRecord.needsMultipleTreatments && viewRecord.treatmentB && (
                  <div className="bg-orange-50 rounded-xl p-4 border border-orange-200">
                    <h4 className="text-xs font-bold text-orange-700 uppercase tracking-wider mb-3 flex items-center gap-2"><FaSyringe /> Treatment B</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div><span className="text-gray-500 block text-xs">Type</span><span className="font-semibold">{viewRecord.treatmentB?.treatmentType || "—"}</span></div>
                      <div><span className="text-gray-500 block text-xs">Medication</span><span className="font-semibold">{getMedName(viewRecord.treatmentB?.medication)}</span></div>
                      <div><span className="text-gray-500 block text-xs">Dosage</span><span className="font-semibold">{viewRecord.treatmentB?.dosage || "—"}</span></div>
                      <div><span className="text-gray-500 block text-xs">Route</span><span className="font-semibold">{viewRecord.treatmentB?.route || "—"}</span></div>
                    </div>
                  </div>
                )}

                {/* Post-Treatment & Follow-up */}
                <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                  <h4 className="text-xs font-bold text-green-700 uppercase tracking-wider mb-3 flex items-center gap-2"><FaClipboardCheck /> Post-Treatment & Follow-up</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                    <div><span className="text-gray-500 block text-xs">Treated By</span><span className="font-semibold">{viewRecord.treatedBy || "—"}</span></div>
                    <div><span className="text-gray-500 block text-xs">Observation Time</span><span className="font-semibold">{viewRecord.observationTime || "—"}</span></div>
                    <div>
                      <span className="text-gray-500 block text-xs">Recovery Status</span>
                      <StatusBadge status={viewRecord.recoveryStatus} />
                    </div>
                    <div><span className="text-gray-500 block text-xs">Post-Weight</span><span className="font-semibold">{viewRecord.postWeight ? `${viewRecord.postWeight} kg` : "—"}</span></div>
                    <div><span className="text-gray-500 block text-xs">Completion Date</span><span className="font-semibold">{viewRecord.completionDate ? new Date(viewRecord.completionDate).toLocaleDateString() : "—"}</span></div>
                    <div><span className="text-gray-500 block text-xs">Post Observation</span><span className="font-semibold">{viewRecord.postObservation || "—"}</span></div>
                  </div>
                </div>

                {/* Notes */}
                {viewRecord.notes && (
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">📝 Notes</h4>
                    <p className="text-sm text-gray-800 whitespace-pre-wrap">{viewRecord.notes}</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2 border-t border-gray-200">
                  <button onClick={() => { handleEdit(viewRecord); setViewRecord(null); }}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-100 text-blue-700 rounded-xl font-semibold text-sm hover:bg-blue-200 transition">
                    <FaEdit /> Edit Record
                  </button>
                  <button onClick={() => { handleDelete(viewRecord._id); setViewRecord(null); }}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-100 text-red-700 rounded-xl font-semibold text-sm hover:bg-red-200 transition">
                    <FaTrash /> Delete
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Content Views ─── */}
      {loading ? (
        <Loader message="Loading health records..." color="teal-600" />
      ) : (
        <>
          {/* ── All Records Table ── */}
          {viewMode === "records" && (
            filtered.length === 0 ? (
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
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-700">Vaccines</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-700">Treated By</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-700">Status</th>
                        <th className="px-4 py-3 text-center text-xs font-bold text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((r, idx) => (
                        <motion.tr key={r._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                          transition={{ delay: idx * 0.015 }} className="border-b border-gray-100 hover:bg-teal-50/50 cursor-pointer"
                          onClick={() => setViewRecord(r)}>
                          <td className="px-4 py-3 text-sm whitespace-nowrap">{r.date ? new Date(r.date).toLocaleDateString() : "—"}</td>
                          <td className="px-4 py-3">
                            <div className="font-bold text-sm">{r.animalTagId || "—"}</div>
                            <div className="text-xs text-gray-500">{r.animalGender} • {r.animalBreed}</div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700 max-w-[180px] truncate">{r.diagnosis || r.symptoms || "—"}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            <div>{r.treatmentA?.treatmentType || "—"}</div>
                            <div className="text-xs text-gray-500">{getMedName(r.treatmentA?.medication)}</div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">{r.vaccines || "—"}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{r.treatedBy || "—"}</td>
                          <td className="px-4 py-3"><StatusBadge status={r.recoveryStatus} /></td>
                          <td className="px-4 py-3 text-center" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-center gap-1">
                              <button onClick={() => handleEdit(r)} className="p-1.5 bg-blue-100 text-blue-700 rounded-lg text-xs hover:bg-blue-200"><FaEdit size={12} /></button>
                              <button onClick={() => handleDelete(r._id)} disabled={deleting === r._id}
                                className="p-1.5 bg-red-100 text-red-700 rounded-lg text-xs hover:bg-red-200 disabled:opacity-50">
                                {deleting === r._id ? <FaSpinner className="animate-spin" size={12} /> : <FaTrash size={12} />}
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          )}

          {/* ── By Animal View ── */}
          {viewMode === "animals" && (
            <div className="space-y-4">
              {Object.values(animalHealthMap).length === 0 ? (
                <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                  <div className="text-6xl mb-4">🐑</div>
                  <p className="text-gray-600">No animals found.</p>
                </div>
              ) : (
                Object.values(animalHealthMap)
                  .filter(entry => {
                    if (!searchTerm) return true;
                    const q = searchTerm.toLowerCase();
                    return (entry.animal.tagId || "").toLowerCase().includes(q) ||
                      (entry.animal.name || "").toLowerCase().includes(q) ||
                      (entry.animal.breed || "").toLowerCase().includes(q);
                  })
                  .sort((a, b) => (b.records.length || 0) - (a.records.length || 0))
                  .map(entry => {
                    const a = entry.animal;
                    const isExpanded = expandedAnimal === a._id;
                    const latestRec = entry.records[0];
                    return (
                      <motion.div key={a._id} layout className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
                        {/* Animal Card Header */}
                        <div
                          className="p-4 flex items-center gap-4 cursor-pointer hover:bg-gray-50 transition"
                          onClick={() => setExpandedAnimal(isExpanded ? null : a._id)}
                        >
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center text-white text-lg font-bold shadow-md flex-shrink-0">
                            {(a.tagId || "?").slice(0, 3)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-bold text-gray-900">{a.tagId}</h4>
                              {a.name && <span className="text-gray-500 text-sm">({a.name})</span>}
                              <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">{a.species} • {a.breed} • {a.gender}</span>
                            </div>
                            <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                              <span>📋 {entry.records.length} record{entry.records.length !== 1 ? "s" : ""}</span>
                              {a.paddock && <span>🏠 {a.paddock}</span>}
                              {a.currentWeight > 0 && <span>⚖️ {a.currentWeight} kg</span>}
                              <span>💊 Med Cost: {formatCurrency(entry.totalMedCost, businessSettings.currency)}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 flex-shrink-0">
                            {entry.latestStatus && <StatusBadge status={entry.latestStatus} />}
                            {isExpanded ? <FaChevronUp className="text-gray-400" /> : <FaChevronDown className="text-gray-400" />}
                          </div>
                        </div>

                        {/* Expanded Records */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                              className="border-t border-gray-100">
                              {entry.records.length === 0 ? (
                                <div className="p-6 text-center text-gray-500 text-sm">No health records for this animal yet.</div>
                              ) : (
                                <div className="divide-y divide-gray-50">
                                  {entry.records.map(r => (
                                    <div key={r._id}
                                      className="px-6 py-3 flex items-center gap-4 hover:bg-teal-50/50 cursor-pointer transition text-sm"
                                      onClick={() => setViewRecord(r)}
                                    >
                                      <div className="w-20 text-gray-500 flex-shrink-0">{r.date ? new Date(r.date).toLocaleDateString() : "—"}</div>
                                      <div className="flex-1 min-w-0">
                                        <span className="font-semibold text-gray-900">{r.diagnosis || r.symptoms || "Routine Check"}</span>
                                        {r.treatmentA?.treatmentType && <span className="text-xs text-gray-500 ml-2">• {r.treatmentA.treatmentType}</span>}
                                        {r.vaccines && <span className="text-xs text-purple-600 ml-2">💉 {r.vaccines}</span>}
                                      </div>
                                      <div className="flex items-center gap-2 flex-shrink-0">
                                        <StatusBadge status={r.recoveryStatus} />
                                        <button onClick={(e) => { e.stopPropagation(); handleEdit(r); }}
                                          className="p-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200"><FaEdit size={10} /></button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                              <div className="px-6 py-3 bg-gray-50 flex justify-end">
                                <button onClick={() => { openForm(); handleChange("animal", a._id); setSelectionMode("individual"); }}
                                  className="flex items-center gap-2 px-3 py-1.5 bg-teal-600 text-white rounded-lg text-xs font-semibold hover:bg-teal-700 transition">
                                  <FaPlus size={10} /> Add Record for {a.tagId}
                                </button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })
              )}
            </div>
          )}

          {/* ── Schedule View ── */}
          {viewMode === "schedule" && (
            <div className="space-y-4">
              {scheduleItems.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                  <div className="text-6xl mb-4">📅</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No Scheduled Follow-ups</h3>
                  <p className="text-gray-600">Health records with prescribed days will show upcoming due dates here.</p>
                </div>
              ) : (
                <>
                  {/* Overdue */}
                  {scheduleItems.filter(s => s.isOverdue).length > 0 && (
                    <div>
                      <h3 className="text-sm font-bold text-red-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <FaExclamationTriangle /> Overdue ({scheduleItems.filter(s => s.isOverdue).length})
                      </h3>
                      <div className="space-y-2">
                        {scheduleItems.filter(s => s.isOverdue).map((s, i) => (
                          <ScheduleCard key={i} item={s} type="overdue" businessSettings={businessSettings} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Due Soon (7 days) */}
                  {scheduleItems.filter(s => s.isDueSoon).length > 0 && (
                    <div>
                      <h3 className="text-sm font-bold text-amber-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <FaBell /> Due Within 7 Days ({scheduleItems.filter(s => s.isDueSoon).length})
                      </h3>
                      <div className="space-y-2">
                        {scheduleItems.filter(s => s.isDueSoon).map((s, i) => (
                          <ScheduleCard key={i} item={s} type="soon" businessSettings={businessSettings} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Upcoming */}
                  {scheduleItems.filter(s => !s.isOverdue && !s.isDueSoon).length > 0 && (
                    <div>
                      <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <FaCalendarAlt /> Upcoming ({scheduleItems.filter(s => !s.isOverdue && !s.isDueSoon).length})
                      </h3>
                      <div className="space-y-2">
                        {scheduleItems.filter(s => !s.isOverdue && !s.isDueSoon).map((s, i) => (
                          <ScheduleCard key={i} item={s} type="upcoming" businessSettings={businessSettings} />
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ─── Helper Components ─── */

function ScheduleCard({ item, type }) {
  const colors = {
    overdue: "bg-red-50 border-red-200 text-red-800",
    soon: "bg-amber-50 border-amber-200 text-amber-800",
    upcoming: "bg-white border-gray-200 text-gray-800",
  };
  return (
    <div className={`flex items-center gap-4 p-4 rounded-xl border ${colors[type]} transition hover:shadow-md`}>
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg flex-shrink-0 ${
        type === "overdue" ? "bg-red-100" : type === "soon" ? "bg-amber-100" : "bg-gray-100"
      }`}>
        {type === "overdue" ? "🚨" : type === "soon" ? "⏰" : "📅"}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-bold text-sm">{item.animalTagId} {item.animalName ? `(${item.animalName})` : ""}</div>
        <div className="text-xs mt-0.5">{item.type} • Last: {new Date(item.lastDate).toLocaleDateString()}</div>
      </div>
      <div className="text-right flex-shrink-0">
        <div className="font-bold text-sm">{new Date(item.nextDue).toLocaleDateString()}</div>
        <div className="text-xs">
          {type === "overdue"
            ? `${Math.ceil((new Date() - item.nextDue) / 86400000)} days overdue`
            : type === "soon"
              ? `${Math.ceil((item.nextDue - new Date()) / 86400000)} days left`
              : `in ${Math.ceil((item.nextDue - new Date()) / 86400000)} days`
          }
        </div>
      </div>
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

HealthRecords.layoutType = "default";
HealthRecords.layoutProps = { title: "Health Records" };
