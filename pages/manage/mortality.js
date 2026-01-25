import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "framer-motion";
import { FaPlus, FaSkull, FaCalendar, FaSpinner, FaTimes, FaCheck, FaExclamationTriangle } from "react-icons/fa";
import PageHeader from "@/components/shared/PageHeader";
import StatsSummary from "@/components/shared/StatsSummary";

export default function MortalityTracking() {
  const router = useRouter();
  const [animals, setAnimals] = useState([]);
  const [mortalityRecords, setMortalityRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCause, setFilterCause] = useState("all");
  const [formData, setFormData] = useState({
    animalId: "",
    deathDate: "",
    cause: "",
    symptoms: "",
    notes: "",
    preventable: false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const causeOptions = [
    "Disease",
    "Injury",
    "Predator Attack",
    "Birth Complications",
    "Old Age",
    "Malnutrition",
    "Weather/Environmental",
    "Unknown",
    "Other"
  ];

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

      // Store mortality records in localStorage (can be moved to API later)
      const storedRecords = localStorage.getItem("mortalityRecords");
      if (storedRecords) {
        setMortalityRecords(JSON.parse(storedRecords));
      }
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setLoading(false);
    }
  };

  const aliveAnimals = animals.filter(a => a.status === "Alive");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.animalId || !formData.deathDate || !formData.cause) {
      setError("Please fill in all required fields");
      return;
    }

    setSaving(true);

    try {
      const animal = animals.find(a => a._id === formData.animalId);

      const newRecord = {
        id: Date.now().toString(),
        animal: { 
          id: animal._id, 
          name: animal.name, 
          tagId: animal.tagId,
          species: animal.species,
          breed: animal.breed,
          gender: animal.gender,
          dob: animal.dob
        },
        deathDate: formData.deathDate,
        cause: formData.cause,
        symptoms: formData.symptoms,
        notes: formData.notes,
        preventable: formData.preventable,
        createdAt: new Date().toISOString(),
      };

      // Update animal status to "Deceased" via API
      const token = localStorage.getItem("token");
      await fetch(`/api/animals/${animal._id}`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ status: "Deceased" })
      });

      const updatedRecords = [...mortalityRecords, newRecord];
      setMortalityRecords(updatedRecords);
      localStorage.setItem("mortalityRecords", JSON.stringify(updatedRecords));

      // Refresh animals list
      fetchData();

      setSuccess("Mortality record added successfully!");
      setFormData({
        animalId: "",
        deathDate: "",
        cause: "",
        symptoms: "",
        notes: "",
        preventable: false,
      });
      setShowForm(false);
    } catch (err) {
      setError("Failed to save mortality record");
    } finally {
      setSaving(false);
    }
  };

  const deleteRecord = (recordId) => {
    if (!confirm("Are you sure you want to delete this mortality record?")) return;
    const updatedRecords = mortalityRecords.filter(r => r.id !== recordId);
    setMortalityRecords(updatedRecords);
    localStorage.setItem("mortalityRecords", JSON.stringify(updatedRecords));
  };

  const filteredRecords = mortalityRecords.filter(record => {
    const matchesSearch = 
      record.animal?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.animal?.tagId?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterCause === "all" || record.cause === filterCause;
    return matchesSearch && matchesFilter;
  });

  // Calculate stats
  const thisMonth = new Date().getMonth();
  const thisYear = new Date().getFullYear();
  const monthlyDeaths = mortalityRecords.filter(r => {
    const d = new Date(r.deathDate);
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
  }).length;

  const preventableDeaths = mortalityRecords.filter(r => r.preventable).length;

  const causeBreakdown = mortalityRecords.reduce((acc, r) => {
    acc[r.cause] = (acc[r.cause] || 0) + 1;
    return acc;
  }, {});

  const topCause = Object.entries(causeBreakdown).sort((a, b) => b[1] - a[1])[0];

  const getCauseColor = (cause) => {
    const colors = {
      "Disease": "bg-red-100 text-red-800 border-red-300",
      "Injury": "bg-orange-100 text-orange-800 border-orange-300",
      "Predator Attack": "bg-purple-100 text-purple-800 border-purple-300",
      "Birth Complications": "bg-pink-100 text-pink-800 border-pink-300",
      "Old Age": "bg-gray-100 text-gray-800 border-gray-300",
      "Malnutrition": "bg-yellow-100 text-yellow-800 border-yellow-300",
      "Weather/Environmental": "bg-blue-100 text-blue-800 border-blue-300",
      "Unknown": "bg-gray-100 text-gray-600 border-gray-300",
    };
    return colors[cause] || "bg-gray-100 text-gray-800 border-gray-300";
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      {/* Page Header */}
      <PageHeader
        title="Mortality Tracking"
        subtitle="Record and analyze animal deaths to improve farm health"
        gradient="from-gray-700 to-gray-900"
        icon="📊"
      />

      {/* Stats Summary */}
      <StatsSummary
        stats={[
          { label: "Total Deaths", value: mortalityRecords.length, bgColor: "bg-gray-50", borderColor: "border-gray-200", textColor: "text-gray-900", icon: "📋" },
          { label: "This Month", value: monthlyDeaths, bgColor: "bg-red-50", borderColor: "border-red-200", textColor: "text-red-700", icon: "📅" },
          { label: "Preventable", value: preventableDeaths, bgColor: "bg-yellow-50", borderColor: "border-yellow-200", textColor: "text-yellow-700", icon: "⚠️" },
          { label: "Top Cause", value: topCause ? topCause[0] : "N/A", bgColor: "bg-purple-50", borderColor: "border-purple-200", textColor: "text-purple-700", icon: "🔍", isText: true },
        ]}
      />

      {/* Controls */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <input
              type="text"
              placeholder="Search by animal name or tag..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-100"
            />
            <select
              value={filterCause}
              onChange={(e) => setFilterCause(e.target.value)}
              className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-100"
            >
              <option value="all">All Causes</option>
              {causeOptions.map(cause => (
                <option key={cause} value={cause}>{cause}</option>
              ))}
            </select>
          </div>
          <motion.button
            onClick={() => setShowForm(!showForm)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
              showForm
                ? "bg-gray-200 text-gray-700"
                : "bg-gradient-to-r from-gray-700 to-gray-900 text-white shadow-lg hover:shadow-xl"
            }`}
          >
            {showForm ? <FaTimes /> : <FaPlus />}
            {showForm ? "Cancel" : "Record Death"}
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
            <div className="bg-gradient-to-r from-gray-700 to-gray-900 px-6 py-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <FaSkull /> Record Animal Death
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">
                    Animal *
                  </label>
                  <select
                    value={formData.animalId}
                    onChange={(e) => setFormData({ ...formData, animalId: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-gray-500"
                    required
                  >
                    <option value="">Select animal...</option>
                    {aliveAnimals.map((animal) => (
                      <option key={animal._id} value={animal._id}>
                        {animal.name} ({animal.tagId}) - {animal.species}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <FaCalendar className="text-gray-500" />
                    Date of Death *
                  </label>
                  <input
                    type="date"
                    value={formData.deathDate}
                    onChange={(e) => setFormData({ ...formData, deathDate: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-gray-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">
                    Cause of Death *
                  </label>
                  <select
                    value={formData.cause}
                    onChange={(e) => setFormData({ ...formData, cause: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-gray-500"
                    required
                  >
                    <option value="">Select cause...</option>
                    {causeOptions.map(cause => (
                      <option key={cause} value={cause}>{cause}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">
                    Symptoms Before Death
                  </label>
                  <input
                    type="text"
                    value={formData.symptoms}
                    onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-gray-500"
                    placeholder="e.g., Lethargy, loss of appetite..."
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-gray-500"
                  placeholder="Additional details about the death..."
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="preventable"
                  checked={formData.preventable}
                  onChange={(e) => setFormData({ ...formData, preventable: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-300 text-red-600 focus:ring-red-500"
                />
                <label htmlFor="preventable" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <FaExclamationTriangle className="text-yellow-500" />
                  This death was preventable
                </label>
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
                className="w-full py-4 bg-gradient-to-r from-gray-700 to-gray-900 text-white rounded-xl font-bold shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <FaSpinner className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <FaCheck />
                    Save Mortality Record
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
          <FaSpinner className="animate-spin text-gray-600 w-8 h-8" />
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No Mortality Records</h3>
          <p className="text-gray-600">No animal deaths have been recorded yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Animal</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Date</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Cause</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Symptoms</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-gray-700">Preventable</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((record, idx) => (
                  <motion.tr
                    key={record.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-bold text-gray-900">{record.animal?.name}</div>
                        <div className="text-sm text-gray-500">{record.animal?.tagId} • {record.animal?.species}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {new Date(record.deathDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getCauseColor(record.cause)}`}>
                        {record.cause}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600 max-w-xs truncate">
                      {record.symptoms || "-"}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {record.preventable ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-bold">
                          <FaExclamationTriangle /> Yes
                        </span>
                      ) : (
                        <span className="text-gray-400">No</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => deleteRecord(record.id)}
                        className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-sm font-semibold hover:bg-red-200"
                      >
                        Delete
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Cause Analysis */}
      {mortalityRecords.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Cause Analysis</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Object.entries(causeBreakdown).map(([cause, count]) => (
              <div
                key={cause}
                className={`p-4 rounded-xl border-2 text-center ${getCauseColor(cause)}`}
              >
                <div className="text-2xl font-bold">{count}</div>
                <div className="text-sm font-medium">{cause}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

MortalityTracking.layoutType = "default";
