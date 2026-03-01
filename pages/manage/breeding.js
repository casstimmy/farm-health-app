import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "framer-motion";
import { FaPlus, FaHeart, FaCalendar, FaVenus, FaMars, FaChevronRight, FaSpinner, FaTimes, FaCheck, FaBaby } from "react-icons/fa";
import PageHeader from "@/components/shared/PageHeader";
import StatsSummary from "@/components/shared/StatsSummary";
import FilterBar from "@/components/shared/FilterBar";
import Loader from "@/components/Loader";
import { useAnimalData } from "@/context/AnimalDataContext";
import { PERIOD_OPTIONS, filterByPeriod, filterByLocation } from "@/utils/filterHelpers";

export default function BreedingManagement() {
  const router = useRouter();
  const { fetchAnimals: fetchGlobalAnimals } = useAnimalData();
  const [animals, setAnimals] = useState([]);
  const [breedingRecords, setBreedingRecords] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPeriod, setFilterPeriod] = useState("all");
  const [filterLocation, setFilterLocation] = useState("all");
  const [formData, setFormData] = useState({
    doe: "",
    buck: "",
    matingDate: "",
    breedingType: "Natural",
    breedingCoordinator: "",
    expectedDueDate: "",
    location: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  // Register Kids modal
  const [showRegisterKids, setShowRegisterKids] = useState(null);
  const [kidForm, setKidForm] = useState({ tagId: "", name: "", gender: "Female", dob: "", weight: "" });
  const [kidSaving, setKidSaving] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      const [animalsResult, breedingRes, locRes] = await Promise.all([
        fetchGlobalAnimals().catch(() => []),
        fetch("/api/breeding", { headers }),
        fetch("/api/locations", { headers }),
      ]);

      const breedingData = breedingRes.ok ? await breedingRes.json() : [];
      const locData = locRes.ok ? await locRes.json() : [];

      setAnimals(Array.isArray(animalsResult) ? animalsResult : []);
      setBreedingRecords(Array.isArray(breedingData) ? breedingData : []);
      setLocations(Array.isArray(locData) ? locData : []);
      // Auto-fill location if only one available
      if (Array.isArray(locData) && locData.length === 1 && !formData.location) {
        setFormData(prev => ({ ...prev, location: locData[0]._id }));
      }
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setLoading(false);
    }
  };

  const femaleAnimals = animals.filter(a => a.gender?.toLowerCase() === "female" && a.status === "Alive");
  const maleAnimals = animals.filter(a => a.gender?.toLowerCase() === "male" && a.status === "Alive");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.doe || !formData.buck || !formData.matingDate) {
      setError("Please fill in all required fields");
      return;
    }

    setSaving(true);

    try {
      const token = localStorage.getItem("token");
      const doeAnimal = animals.find(a => a._id === formData.doe);
      const payload = {
        breedingId: `BR-${Date.now()}`,
        doe: formData.doe,
        buck: formData.buck,
        species: doeAnimal?.species || "",
        matingDate: formData.matingDate,
        breedingType: formData.breedingType,
        breedingCoordinator: formData.breedingCoordinator,
        expectedDueDate: formData.expectedDueDate || calculateDueDate(formData.matingDate),
        pregnancyStatus: "Pending",
        location: formData.location || null,
        notes: formData.notes,
      };

      const res = await fetch("/api/breeding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save breeding record");
      }

      setSuccess("Breeding record added successfully!");
      setFormData({
        doe: "",
        buck: "",
        matingDate: "",
        breedingType: "Natural",
        breedingCoordinator: "",
        expectedDueDate: "",
        location: "",
        notes: "",
      });
      setShowForm(false);
      fetchData();
    } catch (err) {
      setError(err.message || "Failed to save breeding record");
    } finally {
      setSaving(false);
    }
  };

  const calculateDueDate = (matingDate) => {
    // Average goat gestation: 150 days
    const date = new Date(matingDate);
    date.setDate(date.getDate() + 150);
    return date.toISOString().split("T")[0];
  };

  const updateRecordStatus = async (recordId, newStatus) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/breeding/${recordId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ pregnancyStatus: newStatus }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update record");
      }

      fetchData();
    } catch (err) {
      setError(err.message || "Failed to update record status");
    }
  };

  const deleteRecord = async (recordId) => {
    if (!confirm("Are you sure you want to delete this breeding record?")) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/breeding/${recordId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete record");
      }

      fetchData();
    } catch (err) {
      setError(err.message || "Failed to delete breeding record");
    }
  };

  const filteredRecords = filterByLocation(filterByPeriod(breedingRecords.filter(record => {
    const term = searchTerm.trim().toLowerCase();
    const doeName = String(record.doe?.name || "");
    const buckName = String(record.buck?.name || "");
    const doeTag = String(record.doe?.tagId || "");
    const buckTag = String(record.buck?.tagId || "");
    const breedingId = String(record.breedingId || "");
    const matchesSearch =
      term === "" ||
      doeName.toLowerCase().includes(term) ||
      buckName.toLowerCase().includes(term) ||
      doeTag.toLowerCase().includes(term) ||
      buckTag.toLowerCase().includes(term) ||
      breedingId.toLowerCase().includes(term);
    const matchesFilter = filterStatus === "all" || record.pregnancyStatus === filterStatus;
    return matchesSearch && matchesFilter;
  }), filterPeriod, "matingDate"), filterLocation);

  const stats = {
    total: breedingRecords.length,
    pending: breedingRecords.filter(r => r.pregnancyStatus === "Pending").length,
    confirmed: breedingRecords.filter(r => r.pregnancyStatus === "Confirmed").length,
    delivered: breedingRecords.filter(r => r.pregnancyStatus === "Delivered").length,
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Pending": return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "Confirmed": return "bg-blue-100 text-blue-800 border-blue-300";
      case "Delivered": return "bg-green-100 text-green-800 border-green-300";
      case "Not Pregnant": return "bg-red-100 text-red-800 border-red-300";
      default: return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getDaysUntilDue = (dueDate) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleRegisterKid = async (e) => {
    e.preventDefault();
    if (!kidForm.tagId || !kidForm.gender) {
      setError("Tag ID and Gender are required for the new animal.");
      return;
    }
    setKidSaving(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const record = showRegisterKids;
      const doeAnimal = animals.find(a => a._id === (record.doe?._id || record.doe));
      const buckAnimal = animals.find(a => a._id === (record.buck?._id || record.buck));
      const payload = {
        tagId: kidForm.tagId,
        name: kidForm.name || kidForm.tagId,
        species: doeAnimal?.species || record.species || "Goat",
        breed: doeAnimal?.breed || "",
        gender: kidForm.gender,
        dob: kidForm.dob || new Date().toISOString().split("T")[0],
        origin: "Born on Farm",
        acquisitionType: "Born",
        acquisitionDate: kidForm.dob || new Date().toISOString().split("T")[0],
        sire: buckAnimal?._id || record.buck?._id || record.buck,
        dam: doeAnimal?._id || record.doe?._id || record.doe,
        currentWeight: kidForm.weight ? Number(kidForm.weight) : 0,
        status: "Alive",
      };
      const res = await fetch("/api/animals", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to register kid");
      }
      // Delete the breeding record after successful kid registration
      try {
        await fetch(`/api/breeding/${record._id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (delErr) {
        console.warn("Kid registered but failed to remove breeding record:", delErr);
      }
      setSuccess(`Kid ${kidForm.tagId} registered successfully! Linked to ${doeAnimal?.tagId || "Dam"} × ${buckAnimal?.tagId || "Sire"}. Breeding record removed.`);
      setShowRegisterKids(null);
      setKidForm({ tagId: "", name: "", gender: "Female", dob: "", weight: "" });
      fetchGlobalAnimals();
      fetchData();
    } catch (err) {
      setError(err.message);
    } finally {
      setKidSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      {/* Page Header */}
      <PageHeader
        title="Breeding Management"
        subtitle="Track breeding records, pregnancies, and births"
        gradient="from-pink-600 to-rose-700"
        icon="💕"
      />

      {/* Stats Summary */}
      <StatsSummary
        stats={[
          { label: "Total Records", value: stats.total, bgColor: "bg-gray-50", borderColor: "border-gray-200", textColor: "text-gray-900", icon: "📋" },
          { label: "Pending", value: stats.pending, bgColor: "bg-yellow-50", borderColor: "border-yellow-200", textColor: "text-yellow-700", icon: "⏳" },
          { label: "Confirmed Pregnant", value: stats.confirmed, bgColor: "bg-blue-50", borderColor: "border-blue-200", textColor: "text-blue-700", icon: "🤰" },
          { label: "Successfully Delivered", value: stats.delivered, bgColor: "bg-green-50", borderColor: "border-green-200", textColor: "text-green-700", icon: "🐣" },
        ]}
      />

      {/* Controls */}
      <FilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        placeholder="Search by animal name..."
        filters={[
          { value: filterPeriod, onChange: setFilterPeriod, options: PERIOD_OPTIONS },
          { value: filterLocation, onChange: setFilterLocation, options: [{ value: "all", label: "All Locations" }, ...locations.map((l) => ({ value: l._id, label: l.name }))] },
          { value: filterStatus, onChange: setFilterStatus, options: [{ value: "all", label: "All Status" }, { value: "Pending", label: "Pending" }, { value: "Confirmed", label: "Confirmed" }, { value: "Delivered", label: "Delivered" }, { value: "Not Pregnant", label: "Not Pregnant" }] },
        ]}
        showAddButton={true}
        onAddClick={() => setShowForm(!showForm)}
        isAddActive={showForm}
        addLabel={showForm ? "Cancel" : "Add Breeding Record"}
      />

      {/* Add Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
          >
            <div className="bg-gradient-to-r from-pink-600 to-rose-600 px-6 py-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <FaHeart /> New Breeding Record
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <FaVenus className="text-pink-500" />
                    Female (Doe) *
                  </label>
                  <select
                    value={formData.doe}
                    onChange={(e) => setFormData({ ...formData, doe: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-pink-500"
                    required
                  >
                    <option value="">Select female...</option>
                    {femaleAnimals.map((animal) => (
                      <option key={animal._id} value={animal._id}>
                        {animal.name} ({animal.tagId})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <FaMars className="text-blue-500" />
                    Male (Buck) *
                  </label>
                  <select
                    value={formData.buck}
                    onChange={(e) => setFormData({ ...formData, buck: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-pink-500"
                    required
                  >
                    <option value="">Select male...</option>
                    {maleAnimals.map((animal) => (
                      <option key={animal._id} value={animal._id}>
                        {animal.name} ({animal.tagId})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <FaCalendar className="text-pink-500" />
                    Mating Date *
                  </label>
                  <input
                    type="date"
                    value={formData.matingDate}
                    onChange={(e) => setFormData({ ...formData, matingDate: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-pink-500"
                    required
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <FaHeart className="text-pink-500" />
                    Breeding Type
                  </label>
                  <select
                    value={formData.breedingType}
                    onChange={(e) => setFormData({ ...formData, breedingType: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-pink-500"
                  >
                    <option value="Natural">Natural</option>
                    <option value="AI">Artificial Insemination</option>
                  </select>
                </div>
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <FaBaby className="text-pink-500" />
                    Expected Due Date
                  </label>
                  <input
                    type="date"
                    value={formData.expectedDueDate}
                    onChange={(e) => setFormData({ ...formData, expectedDueDate: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-pink-500"
                    placeholder="Auto-calculated if empty"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">Breeding Coordinator</label>
                <input
                  type="text"
                  value={formData.breedingCoordinator}
                  onChange={(e) => setFormData({ ...formData, breedingCoordinator: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-pink-500"
                  placeholder="Name of coordinator..."
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">Location</label>
                <select
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-pink-500"
                >
                  <option value="">Select location...</option>
                  {locations.map((l) => (
                    <option key={l._id} value={l._id}>{l.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-pink-500"
                  placeholder="Add any additional notes..."
                />
              </div>

              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg">
                  ⚠️ {error}
                </div>
              )}

              {success && (
                <div className="bg-green-50 border-l-4 border-green-500 text-green-700 px-4 py-3 rounded-lg">
                  ✅ {success}
                </div>
              )}

              <motion.button
                type="submit"
                disabled={saving}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-4 bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <FaSpinner className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <FaCheck />
                    Save Breeding Record
                  </>
                )}
              </motion.button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Records List */}
      {loading ? (
        <Loader message="Loading breeding records..." color="pink-600" />
      ) : filteredRecords.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
          <div className="text-6xl mb-4">💕</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No Breeding Records</h3>
          <p className="text-gray-600">Start tracking breeding by adding your first record.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRecords.map((record, idx) => {
            const daysUntil = getDaysUntilDue(record.expectedDueDate);
            const isOverdue = daysUntil < 0 && record.pregnancyStatus !== "Delivered";
            
            return (
              <motion.div
                key={record._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all"
              >
                <div className="bg-gradient-to-r from-pink-50 to-rose-50 px-6 py-4 border-b border-pink-100">
                  <div className="flex items-center justify-between">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(record.pregnancyStatus)}`}>
                      {record.pregnancyStatus?.toUpperCase()}
                    </span>
                    {isOverdue && (
                      <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold">
                        OVERDUE
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="p-6 space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <FaVenus className="text-pink-500" />
                        <span className="font-bold text-gray-900">{record.doe?.name}</span>
                      </div>
                      <p className="text-xs text-gray-500">{record.doe?.tagId}</p>
                    </div>
                    <FaHeart className="text-pink-400" />
                    <div className="flex-1 text-right">
                      <div className="flex items-center justify-end gap-2 mb-1">
                        <span className="font-bold text-gray-900">{record.buck?.name}</span>
                        <FaMars className="text-blue-500" />
                      </div>
                      <p className="text-xs text-gray-500">{record.buck?.tagId}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Mating Date</p>
                      <p className="font-semibold">{new Date(record.matingDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Due Date</p>
                      <p className={`font-semibold ${isOverdue ? "text-red-600" : ""}`}>
                        {record.expectedDueDate ? new Date(record.expectedDueDate).toLocaleDateString() : "—"}
                      </p>
                    </div>
                  </div>

                  {record.breedingType && (
                    <div className="text-xs text-gray-500">
                      Type: <span className="font-semibold text-gray-700">{record.breedingType}</span>
                    </div>
                  )}

                  {record.pregnancyStatus !== "Delivered" && record.expectedDueDate && (
                    <div className={`text-center py-2 rounded-lg ${isOverdue ? "bg-red-50 text-red-700" : "bg-pink-50 text-pink-700"}`}>
                      {isOverdue
                        ? `${Math.abs(daysUntil)} days overdue`
                        : `${daysUntil} days until due`}
                    </div>
                  )}

                  {record.notes && (
                    <p className="text-sm text-gray-600 italic">&quot;{record.notes}&quot;</p>
                  )}

                  <div className="flex gap-2 pt-2 flex-wrap">
                    {record.pregnancyStatus === "Pending" && (
                      <button
                        onClick={() => updateRecordStatus(record._id, "Confirmed")}
                        className="flex-1 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-semibold hover:bg-blue-200"
                      >
                        Confirm Pregnancy
                      </button>
                    )}
                    {record.pregnancyStatus === "Confirmed" && (
                      <button
                        onClick={() => updateRecordStatus(record._id, "Delivered")}
                        className="flex-1 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-semibold hover:bg-green-200"
                      >
                        Mark Delivered
                      </button>
                    )}
                    {record.pregnancyStatus === "Delivered" && (
                      <button
                        onClick={() => setShowRegisterKids(record)}
                        className="flex-1 py-2 bg-pink-100 text-pink-700 rounded-lg text-sm font-semibold hover:bg-pink-200 flex items-center justify-center gap-1"
                      >
                        <FaBaby /> Register Kid
                      </button>
                    )}
                    <button
                      onClick={() => deleteRecord(record._id)}
                      className="px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-semibold hover:bg-red-200"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Register Kids Modal */}
      <AnimatePresence>
        {showRegisterKids && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowRegisterKids(null)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="bg-white rounded-2xl shadow-2xl max-w-lg w-full" onClick={e => e.stopPropagation()}>
              <div className="bg-gradient-to-r from-pink-600 to-rose-600 px-6 py-4 rounded-t-2xl flex items-center justify-between">
                <h3 className="text-lg font-bold text-white flex items-center gap-2"><FaBaby /> Register New Kid</h3>
                <button onClick={() => setShowRegisterKids(null)} className="text-white hover:text-pink-200"><FaTimes /></button>
              </div>
              <div className="p-6">
                <div className="bg-pink-50 p-3 rounded-lg mb-4 text-sm">
                  <p><b>Dam:</b> {showRegisterKids.doe?.name || showRegisterKids.doe?.tagId || "—"}</p>
                  <p><b>Sire:</b> {showRegisterKids.buck?.name || showRegisterKids.buck?.tagId || "—"}</p>
                  <p className="text-gray-500 mt-1">This kid will be automatically linked to both parents.</p>
                </div>
                <form onSubmit={handleRegisterKid} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-semibold text-gray-700 mb-1 block">Tag ID *</label>
                      <input type="text" value={kidForm.tagId} onChange={e => setKidForm({ ...kidForm, tagId: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-pink-500" required placeholder="e.g., BGF007" />
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-700 mb-1 block">Name</label>
                      <input type="text" value={kidForm.name} onChange={e => setKidForm({ ...kidForm, name: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-pink-500" placeholder="Optional name" />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-semibold text-gray-700 mb-1 block">Gender *</label>
                      <select value={kidForm.gender} onChange={e => setKidForm({ ...kidForm, gender: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-pink-500">
                        <option value="Female">Female</option>
                        <option value="Male">Male</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-700 mb-1 block">Date of Birth</label>
                      <input type="date" value={kidForm.dob} onChange={e => setKidForm({ ...kidForm, dob: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-pink-500" />
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-700 mb-1 block">Birth Weight (kg)</label>
                      <input type="number" value={kidForm.weight} onChange={e => setKidForm({ ...kidForm, weight: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-pink-500" min="0" step="0.1" placeholder="0" />
                    </div>
                  </div>
                  <motion.button type="submit" disabled={kidSaving} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    className="w-full py-4 bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-xl font-bold shadow-lg flex items-center justify-center gap-2">
                    {kidSaving ? <><FaSpinner className="animate-spin" /> Registering...</> : <><FaCheck /> Register Kid</>}
                  </motion.button>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

BreedingManagement.layoutType = "default";
