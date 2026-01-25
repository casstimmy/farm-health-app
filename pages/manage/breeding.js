import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "framer-motion";
import { FaPlus, FaHeart, FaCalendar, FaVenus, FaMars, FaChevronRight, FaSpinner, FaTimes, FaCheck, FaBaby } from "react-icons/fa";
import PageHeader from "@/components/shared/PageHeader";
import StatsSummary from "@/components/shared/StatsSummary";

export default function BreedingManagement() {
  const router = useRouter();
  const [animals, setAnimals] = useState([]);
  const [breedingRecords, setBreedingRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [formData, setFormData] = useState({
    femaleId: "",
    maleId: "",
    breedingDate: "",
    expectedDueDate: "",
    notes: "",
    status: "pending",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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

      const animalsRes = await fetch("/api/animals", { headers });
      const animalsData = await animalsRes.json();
      setAnimals(Array.isArray(animalsData) ? animalsData : []);

      // For now, store breeding records in localStorage (can be moved to API later)
      const storedRecords = localStorage.getItem("breedingRecords");
      if (storedRecords) {
        setBreedingRecords(JSON.parse(storedRecords));
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

    if (!formData.femaleId || !formData.maleId || !formData.breedingDate) {
      setError("Please fill in all required fields");
      return;
    }

    setSaving(true);

    try {
      const female = animals.find(a => a._id === formData.femaleId);
      const male = animals.find(a => a._id === formData.maleId);

      const newRecord = {
        id: Date.now().toString(),
        female: { id: female._id, name: female.name, tagId: female.tagId },
        male: { id: male._id, name: male.name, tagId: male.tagId },
        breedingDate: formData.breedingDate,
        expectedDueDate: formData.expectedDueDate || calculateDueDate(formData.breedingDate),
        notes: formData.notes,
        status: "pending",
        createdAt: new Date().toISOString(),
      };

      const updatedRecords = [...breedingRecords, newRecord];
      setBreedingRecords(updatedRecords);
      localStorage.setItem("breedingRecords", JSON.stringify(updatedRecords));

      setSuccess("Breeding record added successfully!");
      setFormData({
        femaleId: "",
        maleId: "",
        breedingDate: "",
        expectedDueDate: "",
        notes: "",
        status: "pending",
      });
      setShowForm(false);
    } catch (err) {
      setError("Failed to save breeding record");
    } finally {
      setSaving(false);
    }
  };

  const calculateDueDate = (breedingDate) => {
    // Average goat gestation: 150 days
    const date = new Date(breedingDate);
    date.setDate(date.getDate() + 150);
    return date.toISOString().split('T')[0];
  };

  const updateRecordStatus = (recordId, newStatus) => {
    const updatedRecords = breedingRecords.map(r =>
      r.id === recordId ? { ...r, status: newStatus, updatedAt: new Date().toISOString() } : r
    );
    setBreedingRecords(updatedRecords);
    localStorage.setItem("breedingRecords", JSON.stringify(updatedRecords));
  };

  const deleteRecord = (recordId) => {
    if (!confirm("Are you sure you want to delete this breeding record?")) return;
    const updatedRecords = breedingRecords.filter(r => r.id !== recordId);
    setBreedingRecords(updatedRecords);
    localStorage.setItem("breedingRecords", JSON.stringify(updatedRecords));
  };

  const filteredRecords = breedingRecords.filter(record => {
    const matchesSearch = 
      record.female?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.male?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === "all" || record.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: breedingRecords.length,
    pending: breedingRecords.filter(r => r.status === "pending").length,
    confirmed: breedingRecords.filter(r => r.status === "confirmed").length,
    delivered: breedingRecords.filter(r => r.status === "delivered").length,
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "confirmed": return "bg-blue-100 text-blue-800 border-blue-300";
      case "delivered": return "bg-green-100 text-green-800 border-green-300";
      case "failed": return "bg-red-100 text-red-800 border-red-300";
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
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <input
              type="text"
              placeholder="Search by animal name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
            />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="delivered">Delivered</option>
              <option value="failed">Failed</option>
            </select>
          </div>
          <motion.button
            onClick={() => setShowForm(!showForm)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
              showForm
                ? "bg-gray-200 text-gray-700"
                : "bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-lg hover:shadow-xl"
            }`}
          >
            {showForm ? <FaTimes /> : <FaPlus />}
            {showForm ? "Cancel" : "Add Breeding Record"}
          </motion.button>
        </div>
      </div>

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
                    Female Animal *
                  </label>
                  <select
                    value={formData.femaleId}
                    onChange={(e) => setFormData({ ...formData, femaleId: e.target.value })}
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
                    Male Animal *
                  </label>
                  <select
                    value={formData.maleId}
                    onChange={(e) => setFormData({ ...formData, maleId: e.target.value })}
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <FaCalendar className="text-pink-500" />
                    Breeding Date *
                  </label>
                  <input
                    type="date"
                    value={formData.breedingDate}
                    onChange={(e) => setFormData({ ...formData, breedingDate: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-pink-500"
                    required
                  />
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
        <div className="flex justify-center py-12">
          <FaSpinner className="animate-spin text-pink-600 w-8 h-8" />
        </div>
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
            const isOverdue = daysUntil < 0 && record.status !== "delivered";
            
            return (
              <motion.div
                key={record.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all"
              >
                <div className="bg-gradient-to-r from-pink-50 to-rose-50 px-6 py-4 border-b border-pink-100">
                  <div className="flex items-center justify-between">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(record.status)}`}>
                      {record.status.toUpperCase()}
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
                        <span className="font-bold text-gray-900">{record.female?.name}</span>
                      </div>
                      <p className="text-xs text-gray-500">{record.female?.tagId}</p>
                    </div>
                    <FaHeart className="text-pink-400" />
                    <div className="flex-1 text-right">
                      <div className="flex items-center justify-end gap-2 mb-1">
                        <span className="font-bold text-gray-900">{record.male?.name}</span>
                        <FaMars className="text-blue-500" />
                      </div>
                      <p className="text-xs text-gray-500">{record.male?.tagId}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Breeding Date</p>
                      <p className="font-semibold">{new Date(record.breedingDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Due Date</p>
                      <p className={`font-semibold ${isOverdue ? "text-red-600" : ""}`}>
                        {new Date(record.expectedDueDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {record.status !== "delivered" && (
                    <div className={`text-center py-2 rounded-lg ${isOverdue ? "bg-red-50 text-red-700" : "bg-pink-50 text-pink-700"}`}>
                      {isOverdue
                        ? `${Math.abs(daysUntil)} days overdue`
                        : `${daysUntil} days until due`}
                    </div>
                  )}

                  {record.notes && (
                    <p className="text-sm text-gray-600 italic">"{record.notes}"</p>
                  )}

                  <div className="flex gap-2 pt-2">
                    {record.status === "pending" && (
                      <button
                        onClick={() => updateRecordStatus(record.id, "confirmed")}
                        className="flex-1 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-semibold hover:bg-blue-200"
                      >
                        Confirm Pregnancy
                      </button>
                    )}
                    {record.status === "confirmed" && (
                      <button
                        onClick={() => updateRecordStatus(record.id, "delivered")}
                        className="flex-1 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-semibold hover:bg-green-200"
                      >
                        Mark Delivered
                      </button>
                    )}
                    <button
                      onClick={() => deleteRecord(record.id)}
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
    </motion.div>
  );
}

BreedingManagement.layoutType = "default";
