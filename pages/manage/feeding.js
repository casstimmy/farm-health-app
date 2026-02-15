"use client";

import { useState, useEffect, useContext } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { FaPlus, FaTimes, FaSpinner, FaCheck, FaUsers, FaUser } from "react-icons/fa";
import PageHeader from "@/components/shared/PageHeader";
import FilterBar from "@/components/shared/FilterBar";
import Loader from "@/components/Loader";
import { BusinessContext } from "@/context/BusinessContext";
import { formatCurrency } from "@/utils/formatting";
import { useRole } from "@/hooks/useRole";

const FEEDING_METHODS = ["Trough", "Hand-fed", "Grazing", "Automatic Feeder", "Bottle", "Creep Feeder", "Other"];

const initialFormState = {
  date: new Date().toISOString().split("T")[0],
  feedCategory: "",
  inventoryItem: "",
  quantityOffered: "",
  quantityConsumed: "",
  unitCost: "",
  totalCost: "",
  feedingMethod: "",
  notes: "",
};

export default function Feeding() {
  const router = useRouter();
  const { businessSettings } = useContext(BusinessContext);
  const { user } = useRole();
  const [animals, setAnimals] = useState([]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [formData, setFormData] = useState({ ...initialFormState });
  const [feedInventory, setFeedInventory] = useState([]);

  // Group feeding mode
  const [feedingMode, setFeedingMode] = useState("individual"); // "individual" | "group"
  const [selectedAnimalId, setSelectedAnimalId] = useState("");
  const [selectedGroupIds, setSelectedGroupIds] = useState([]);
  const [groupSelectAll, setGroupSelectAll] = useState(false);
  const [distributionMethod, setDistributionMethod] = useState("equal"); // "equal" | "byWeight"

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }
    fetchAll();
  }, [router]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const [animalsRes, recordsRes, invRes] = await Promise.all([
        fetch("/api/animals", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/feeding", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/inventory", { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (animalsRes.ok) {
        const data = await animalsRes.json();
        const list = Array.isArray(data) ? data : [];
        setAnimals(list);
        if (list.length > 0 && !selectedAnimalId) setSelectedAnimalId(list[0]._id);
      }
      if (recordsRes.ok) {
        const data = await recordsRes.json();
        setRecords(Array.isArray(data) ? data : []);
      }
      if (invRes.ok) {
        const data = await invRes.json();
        const feeds = (Array.isArray(data) ? data : []).filter(
          (item) => (item.categoryName || item.category || "").toLowerCase() === "feed"
        );
        setFeedInventory(feeds);
      }
    } catch (err) {
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  // Alive animals only for feeding
  const aliveAnimals = animals.filter((a) => a.status === "Alive" && !a.isArchived);

  // Group selection helpers
  const handleToggleGroupAnimal = (id) => {
    setSelectedGroupIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (groupSelectAll) {
      setSelectedGroupIds([]);
    } else {
      setSelectedGroupIds(aliveAnimals.map((a) => a._id));
    }
    setGroupSelectAll(!groupSelectAll);
  };

  // Inventory item selection auto-fills cost
  const handleInventorySelect = (itemId) => {
    const invItem = feedInventory.find((i) => i._id === itemId);
    const uc = invItem ? (invItem.costPrice || invItem.price || 0) : 0;
    const qty = parseFloat(formData.quantityConsumed) || 0;
    setFormData((prev) => ({
      ...prev,
      inventoryItem: itemId,
      feedCategory: invItem ? invItem.item : prev.feedCategory,
      unitCost: uc,
      totalCost: (uc * qty).toFixed(2),
    }));
  };

  const recalcTotal = (field, value) => {
    const uc = field === "unitCost" ? parseFloat(value) || 0 : parseFloat(formData.unitCost) || 0;
    const qty = field === "quantityConsumed" ? parseFloat(value) || 0 : parseFloat(formData.quantityConsumed) || 0;
    setFormData((prev) => ({
      ...prev,
      [field]: value,
      totalCost: (uc * qty).toFixed(2),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const targetIds = feedingMode === "group" ? selectedGroupIds : [selectedAnimalId];
    if (targetIds.length === 0 || !targetIds[0]) {
      setError("Please select at least one animal.");
      return;
    }
    if (!formData.feedCategory.trim()) {
      setError("Feed category is required.");
      return;
    }

    setFormLoading(true);
    try {
      const token = localStorage.getItem("token");
      let totalQtyOffered = parseFloat(formData.quantityOffered) || 0;
      let totalQtyConsumed = parseFloat(formData.quantityConsumed) || 0;
      let totalUC = parseFloat(formData.unitCost) || 0;

      // For group feeding, distribute quantities
      const count = targetIds.length;
      let perAnimalOffered = totalQtyOffered;
      let perAnimalConsumed = totalQtyConsumed;

      if (feedingMode === "group" && count > 1) {
        if (distributionMethod === "equal") {
          perAnimalOffered = +(totalQtyOffered / count).toFixed(4);
          perAnimalConsumed = +(totalQtyConsumed / count).toFixed(4);
        }
      }

      // Pre-compute total weight for byWeight distribution
      let totalWeight = 0;
      if (feedingMode === "group" && distributionMethod === "byWeight" && count > 1) {
        totalWeight = targetIds.reduce((sum, id) => {
          const animal = aliveAnimals.find((a) => a._id === id);
          return sum + (animal?.currentWeight || 1);
        }, 0);
      }

      const results = await Promise.all(
        targetIds.map(async (animalId) => {
          let qtyOff = perAnimalOffered;
          let qtyCon = perAnimalConsumed;

          if (feedingMode === "group" && distributionMethod === "byWeight" && count > 1) {
            const animal = aliveAnimals.find((a) => a._id === animalId);
            const weight = animal?.currentWeight || 1;
            const ratio = weight / totalWeight;
            qtyOff = +(totalQtyOffered * ratio).toFixed(4);
            qtyCon = +(totalQtyConsumed * ratio).toFixed(4);
          }

          const perCost = +(totalUC * qtyCon).toFixed(2);

          const payload = {
            animalId,
            feedingData: {
              date: formData.date ? new Date(formData.date) : new Date(),
              feedCategory: formData.feedCategory.trim(),
              inventoryItem: formData.inventoryItem || undefined,
              quantityOffered: qtyOff,
              quantityConsumed: qtyCon,
              unitCost: totalUC,
              totalCost: perCost,
              feedingMethod: formData.feedingMethod || undefined,
              notes: formData.notes?.trim() || undefined,
            },
          };

          const res = await fetch("/api/feeding", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify(payload),
          });
          return res.ok;
        })
      );

      const successCount = results.filter(Boolean).length;
      const failCount = results.length - successCount;

      if (failCount > 0) {
        setError(`${failCount} of ${results.length} records failed to save.`);
      }
      setSuccess(`${successCount} feeding record${successCount > 1 ? "s" : ""} saved!`);
      setFormData({ ...initialFormState });
      setShowForm(false);
      setSelectedGroupIds([]);
      setGroupSelectAll(false);
      fetchAll();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Failed to save feeding records.");
    } finally {
      setFormLoading(false);
    }
  };

  // Filtered records
  const filteredRecords = records.filter((record) => {
    const animalName = record.animal?.name || record.animal?.tagId || "";
    const matchSearch =
      searchTerm === "" ||
      (record.feedTypeName || record.feedCategory || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      animalName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchType = filterType === "all" || (record.feedTypeName || record.feedCategory) === filterType;
    return matchSearch && matchType;
  });

  const feedTypes = [...new Set(records.map((r) => r.feedTypeName || r.feedCategory).filter(Boolean))];

  // Stats
  const totalRecords = records.length;
  const totalFeedCost = records.reduce((sum, r) => sum + (r.totalCost || 0), 0);
  const totalConsumed = records.reduce((sum, r) => sum + (r.quantityConsumed || 0), 0);
  const todayRecords = records.filter((r) => {
    const d = new Date(r.date);
    const today = new Date();
    return d.toDateString() === today.toDateString();
  }).length;

  if (loading) return <Loader />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Feeding Records"
        subtitle="Track and manage animal feeding schedules and nutrition"
        icon="🌾"
        actions={
          <button
            onClick={() => { setShowForm(!showForm); setError(""); }}
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors font-medium"
          >
            {showForm ? <FaTimes /> : <FaPlus />}
            {showForm ? "Cancel" : "Add Feeding"}
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
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-sm text-gray-600">Total Records</p>
          <p className="text-2xl font-bold text-gray-900">{totalRecords}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <p className="text-sm text-gray-600">Today&apos;s Feedings</p>
          <p className="text-2xl font-bold text-gray-900">{todayRecords}</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-sm text-gray-600">Total Consumed</p>
          <p className="text-2xl font-bold text-gray-900">{totalConsumed.toFixed(1)} units</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-sm text-gray-600">Total Feed Cost</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalFeedCost, businessSettings.currency)}</p>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 space-y-5"
        >
          <h3 className="text-lg font-bold text-gray-900">Add Feeding Record</h3>

          {/* Feeding Mode Toggle */}
          <div className="flex items-center gap-4">
            <span className="text-sm font-semibold text-gray-700">Mode:</span>
            <button
              type="button"
              onClick={() => setFeedingMode("individual")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                feedingMode === "individual" ? "bg-amber-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <FaUser size={12} /> Individual
            </button>
            <button
              type="button"
              onClick={() => setFeedingMode("group")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                feedingMode === "group" ? "bg-amber-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <FaUsers size={12} /> Group Feeding
            </button>
          </div>

          {/* Animal Selection */}
          {feedingMode === "individual" ? (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Select Animal *</label>
              <select
                value={selectedAnimalId}
                onChange={(e) => setSelectedAnimalId(e.target.value)}
                className="w-full md:w-80 px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-amber-500 focus:outline-none"
              >
                <option value="">-- Select Animal --</option>
                {aliveAnimals.map((a) => (
                  <option key={a._id} value={a._id}>
                    {a.name ? `${a.name} (${a.tagId})` : a.tagId} — {a.currentWeight || "?"}kg
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-gray-700">
                  Select Animals ({selectedGroupIds.length} selected)
                </label>
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-sm text-amber-600 hover:text-amber-800 font-medium"
                >
                  {groupSelectAll ? "Deselect All" : "Select All"}
                </button>
              </div>
              <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1">
                {aliveAnimals.map((a) => (
                  <label key={a._id} className="flex items-center gap-2 px-2 py-1 hover:bg-amber-50 rounded cursor-pointer text-sm">
                    <input
                      type="checkbox"
                      checked={selectedGroupIds.includes(a._id)}
                      onChange={() => handleToggleGroupAnimal(a._id)}
                      className="w-4 h-4 text-amber-600 rounded"
                    />
                    <span className="truncate">
                      {a.name || a.tagId} {a.currentWeight ? `(${a.currentWeight}kg)` : ""}
                    </span>
                  </label>
                ))}
              </div>
              {/* Distribution Method */}
              <div className="flex items-center gap-4">
                <span className="text-sm font-semibold text-gray-700">Distribution:</span>
                <label className="flex items-center gap-1 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="distribution"
                    checked={distributionMethod === "equal"}
                    onChange={() => setDistributionMethod("equal")}
                    className="text-amber-600"
                  />
                  Equal Split
                </label>
                <label className="flex items-center gap-1 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="distribution"
                    checked={distributionMethod === "byWeight"}
                    onChange={() => setDistributionMethod("byWeight")}
                    className="text-amber-600"
                  />
                  By Body Weight
                </label>
              </div>
            </div>
          )}

          {/* Feed Details Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-amber-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Feed Inventory Item</label>
                <select
                  value={formData.inventoryItem}
                  onChange={(e) => handleInventorySelect(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-amber-500 focus:outline-none"
                >
                  <option value="">-- Select Feed Item --</option>
                  {feedInventory.map((item) => (
                    <option key={item._id} value={item._id}>
                      {item.item} (Stock: {item.quantity})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Feed Category *</label>
                <input
                  type="text"
                  value={formData.feedCategory}
                  onChange={(e) => setFormData({ ...formData, feedCategory: e.target.value })}
                  placeholder="Hay, Grain, Supplement..."
                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-amber-500 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Qty Offered {feedingMode === "group" ? "(Total)" : ""}
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.quantityOffered}
                  onChange={(e) => setFormData({ ...formData, quantityOffered: e.target.value })}
                  placeholder="e.g., 10"
                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-amber-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Qty Consumed {feedingMode === "group" ? "(Total)" : ""}
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.quantityConsumed}
                  onChange={(e) => recalcTotal("quantityConsumed", e.target.value)}
                  placeholder="e.g., 8"
                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-amber-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Unit Cost</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.unitCost}
                  onChange={(e) => recalcTotal("unitCost", e.target.value)}
                  placeholder="Auto from inventory"
                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-amber-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Total Cost</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.totalCost}
                  onChange={(e) => setFormData({ ...formData, totalCost: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-200 bg-gray-50 rounded-lg focus:border-amber-500 focus:outline-none"
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Feeding Method</label>
                <select
                  value={formData.feedingMethod}
                  onChange={(e) => setFormData({ ...formData, feedingMethod: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-amber-500 focus:outline-none"
                >
                  <option value="">-- Select --</option>
                  {FEEDING_METHODS.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2 lg:col-span-1">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                  placeholder="Optional notes..."
                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Group summary */}
            {feedingMode === "group" && selectedGroupIds.length > 1 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                <strong>Group Summary:</strong> {selectedGroupIds.length} animals selected.{" "}
                {distributionMethod === "equal"
                  ? `Each gets ${((parseFloat(formData.quantityConsumed) || 0) / selectedGroupIds.length).toFixed(2)} units.`
                  : "Feed distributed proportionally by body weight."}
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={formLoading}
                className="flex items-center gap-2 px-6 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium disabled:opacity-60"
              >
                {formLoading ? <FaSpinner className="animate-spin" /> : <FaCheck />}
                {feedingMode === "group" ? `Feed ${selectedGroupIds.length} Animals` : "Save Record"}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Filter Bar */}
      <FilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        placeholder="Search by feed type or animal..."
        filters={[
          {
            value: filterType,
            onChange: setFilterType,
            options: [
              { value: "all", label: "All Feed Types" },
              ...feedTypes.map((t) => ({ value: t, label: t })),
            ],
          },
        ]}
      />

      {/* Records Table */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        {filteredRecords.length === 0 ? (
          <div className="text-center py-16">
            <span className="text-5xl mb-4 block">🌾</span>
            <p className="text-gray-500 text-lg">No feeding records found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b-2 border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">Animal</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">Feed Type</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">Offered</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">Consumed</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">Method</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">Unit Cost</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">Total Cost</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredRecords.map((record, idx) => (
                  <motion.tr
                    key={record._id || idx}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.02 }}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                      {record.date ? new Date(record.date).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                      {record.animal?.name || record.animal?.tagId || "—"}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-xs font-semibold">
                        {record.feedTypeName || record.feedCategory || "—"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">{record.quantityOffered ?? "—"}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">{record.quantityConsumed ?? "—"}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{record.feedingMethod || "—"}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {formatCurrency(record.unitCost || 0, businessSettings.currency)}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-orange-700">
                      {formatCurrency(record.totalCost || 0, businessSettings.currency)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">{record.notes || "—"}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

Feeding.layoutType = "default";
Feeding.layoutProps = { title: "Feeding Records" };
