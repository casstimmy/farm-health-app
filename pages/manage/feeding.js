"use client";

import { useState, useEffect, useContext } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { FaPlus, FaTimes, FaSpinner, FaCheck, FaUsers, FaUser, FaEdit, FaTrash } from "react-icons/fa";
import PageHeader from "@/components/shared/PageHeader";
import FilterBar from "@/components/shared/FilterBar";
import Loader from "@/components/Loader";
import { BusinessContext } from "@/context/BusinessContext";
import { formatCurrency } from "@/utils/formatting";
import { useRole } from "@/hooks/useRole";
import { PERIOD_OPTIONS, filterByPeriod, filterByLocation } from "@/utils/filterHelpers";
import { useAnimalData } from "@/context/AnimalDataContext";

const FEEDING_METHODS = ["Trough", "Hand-fed", "Grazing", "Automatic Feeder", "Bottle", "Creep Feeder", "Other"];

const initialFormState = {
  date: new Date().toISOString().split("T")[0],
  feedingMethod: "",
  location: "",
  notes: "",
};

const emptyFeedItem = {
  feedCategory: "",
  inventoryItem: "",
  quantityOffered: "",
  quantityConsumed: "",
  unitCost: "",
  totalCost: "",
};

export default function Feeding() {
  const router = useRouter();
  const { businessSettings } = useContext(BusinessContext);
  const { user } = useRole();
  const { animals: globalAnimals, fetchAnimals } = useAnimalData();
  const [animals, setAnimals] = useState([]);
  const [records, setRecords] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterPeriod, setFilterPeriod] = useState("all");
  const [filterLocation, setFilterLocation] = useState("all");
  const [formData, setFormData] = useState({ ...initialFormState });
  const [feedItems, setFeedItems] = useState([{ ...emptyFeedItem }]);
  const [feedInventory, setFeedInventory] = useState([]);
  const [editingId, setEditingId] = useState(null);

  // Group feeding mode
  const [feedingMode, setFeedingMode] = useState("individual");
  const [selectedAnimalId, setSelectedAnimalId] = useState("");
  const [selectedGroupIds, setSelectedGroupIds] = useState([]);
  const [groupSelectAll, setGroupSelectAll] = useState(false);
  const [distributionMethod, setDistributionMethod] = useState("equal");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }
    fetchAll();
  }, [router]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      // Force-refresh animals from global context and fetch the rest in parallel
      const [animalsData, recordsRes, invRes, locRes] = await Promise.all([
        fetchAnimals(true),
        fetch("/api/feeding", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/inventory", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/locations", { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      {
        const list = Array.isArray(animalsData) ? animalsData : [];
        setAnimals(list);
        if (list.length > 0 && !selectedAnimalId) setSelectedAnimalId(list[0]._id);
      }
      if (recordsRes.ok) {
        const data = await recordsRes.json();
        setRecords(Array.isArray(data) ? data : []);
      } else {
        setRecords([]);
      }
      if (invRes.ok) {
        const data = await invRes.json();
        const feeds = (Array.isArray(data) ? data : []).filter(
          (item) => (item.categoryName || item.category || "").toLowerCase().includes("feed")
        );
        setFeedInventory(feeds);
      }
      if (locRes.ok) {
        const data = await locRes.json();
        setLocations(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Feeding fetchAll error:", err);
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const aliveAnimals = animals.filter((a) => a.status === "Alive" && !a.isArchived);

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

  const handleInventorySelect = (itemId, feedIdx = 0) => {
    const invItem = feedInventory.find((i) => i._id === itemId);
    const uc = invItem ? (invItem.costPrice || invItem.price || 0) : 0;
    setFeedItems(prev => {
      const updated = [...prev];
      const qty = parseFloat(updated[feedIdx].quantityConsumed) || 0;
      updated[feedIdx] = {
        ...updated[feedIdx],
        inventoryItem: itemId,
        feedCategory: invItem ? invItem.item : updated[feedIdx].feedCategory,
        unitCost: uc,
        totalCost: (uc * qty).toFixed(2),
      };
      return updated;
    });
  };

  const recalcTotal = (field, value, feedIdx = 0) => {
    setFeedItems(prev => {
      const updated = [...prev];
      const item = { ...updated[feedIdx], [field]: value };
      const uc = field === "unitCost" ? parseFloat(value) || 0 : parseFloat(item.unitCost) || 0;
      const qty = field === "quantityConsumed" ? parseFloat(value) || 0 : parseFloat(item.quantityConsumed) || 0;
      item.totalCost = (uc * qty).toFixed(2);
      updated[feedIdx] = item;
      return updated;
    });
  };

  const addFeedItem = () => {
    setFeedItems(prev => [...prev, { ...emptyFeedItem }]);
  };

  const removeFeedItem = (idx) => {
    if (feedItems.length <= 1) return;
    setFeedItems(prev => prev.filter((_, i) => i !== idx));
  };

  const handleEdit = (record) => {
    setEditingId(record._id);
    setFeedingMode("individual");
    setSelectedAnimalId(record.animal?._id || record.animal || "");
    setFormData({
      date: record.date ? new Date(record.date).toISOString().split("T")[0] : "",
      feedingMethod: record.feedingMethod || "",
      location: record.location?._id || record.location || "",
      notes: record.notes || "",
    });
    
    // Handle both new (feedItems array) and old (single item) data structures
    if (record.feedItems && Array.isArray(record.feedItems) && record.feedItems.length > 0) {
      setFeedItems(record.feedItems.map(fi => ({
        feedCategory: fi.feedTypeName || "",
        inventoryItem: fi.inventoryItem?._id || fi.inventoryItem || "",
        quantityOffered: fi.quantityOffered || "",
        quantityConsumed: fi.quantityConsumed || "",
        unitCost: fi.unitCost || "",
        totalCost: fi.totalCost || "",
      })));
    } else {
      // Fallback for old data structure
      setFeedItems([{
        feedCategory: record.feedTypeName || record.feedCategory || "",
        inventoryItem: record.inventoryItem?._id || record.inventoryItem || "",
        quantityOffered: record.quantityOffered || "",
        quantityConsumed: record.quantityConsumed || "",
        unitCost: record.unitCost || "",
        totalCost: record.totalCost || "",
      }]);
    }
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (editingId) {
      // Edit existing record with current feedItems
      setFormLoading(true);
      try {
        const token = localStorage.getItem("token");
        
        // Process feedItems with calculations
        const processedFeedItems = feedItems.filter(fi => fi.feedCategory?.trim()).map(fi => ({
          feedTypeName: fi.feedCategory.trim(),
          inventoryItem: fi.inventoryItem || undefined,
          quantityOffered: parseFloat(fi.quantityOffered) || 0,
          quantityConsumed: parseFloat(fi.quantityConsumed) || 0,
          unitCost: parseFloat(fi.unitCost) || 0,
          totalCost: parseFloat(fi.totalCost) || 0,
        }));

        if (processedFeedItems.length === 0) {
          setError("At least one feed item is required");
          setFormLoading(false);
          return;
        }

        const res = await fetch(`/api/feeding/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            feedItems: processedFeedItems,
            date: formData.date ? new Date(formData.date) : new Date(),
            feedingMethod: formData.feedingMethod || undefined,
            location: formData.location || undefined,
            notes: formData.notes?.trim() || "",
          }),
        });
        if (!res.ok) throw new Error("Failed to update");
        setSuccess("Record updated!");
        setEditingId(null);
        setShowForm(false);
        setFormData({ ...initialFormState });
        setFeedItems([{ ...emptyFeedItem }]);
        fetchAll();
        setTimeout(() => setSuccess(""), 3000);
      } catch (err) {
        setError(err.message);
      } finally {
        setFormLoading(false);
      }
      return;
    }

    // New record(s)
    const targetIds = feedingMode === "group" ? selectedGroupIds : [selectedAnimalId];
    if (targetIds.length === 0 || !targetIds[0]) {
      setError("Please select at least one animal.");
      return;
    }
    // Validate that at least one feed item has a category
    const validFeedItems = feedItems.filter(fi => fi.feedCategory?.trim());
    if (validFeedItems.length === 0) {
      setError("At least one feed item with a category is required.");
      return;
    }

    setFormLoading(true);
    try {
      const token = localStorage.getItem("token");
      const count = targetIds.length;
      const results = [];

      // Create ONE record per animal with ALL feed items
      const animalResults = await Promise.all(
        targetIds.map(async (animalId) => {
          // Process each feed item for this animal
          const processedFeedItems = validFeedItems.map((fi) => {
            let totalQtyOffered = parseFloat(fi.quantityOffered) || 0;
            let totalQtyConsumed = parseFloat(fi.quantityConsumed) || 0;
            let totalUC = parseFloat(fi.unitCost) || 0;
            let perAnimalOffered = totalQtyOffered;
            let perAnimalConsumed = totalQtyConsumed;

            if (feedingMode === "group" && count > 1 && distributionMethod === "equal") {
              perAnimalOffered = +(totalQtyOffered / count).toFixed(4);
              perAnimalConsumed = +(totalQtyConsumed / count).toFixed(4);
            }

            if (feedingMode === "group" && distributionMethod === "byWeight" && count > 1) {
              const totalWeight = targetIds.reduce((sum, id) => {
                const animal = aliveAnimals.find((a) => a._id === id);
                return sum + (animal?.currentWeight || 1);
              }, 0);
              const animal = aliveAnimals.find((a) => a._id === animalId);
              const weight = animal?.currentWeight || 1;
              const ratio = weight / totalWeight;
              perAnimalOffered = +(totalQtyOffered * ratio).toFixed(4);
              perAnimalConsumed = +(totalQtyConsumed * ratio).toFixed(4);
            }

            const perCost = +(totalUC * perAnimalConsumed).toFixed(2);
            
            return {
              feedTypeName: fi.feedCategory.trim(),
              inventoryItem: fi.inventoryItem || undefined,
              quantityOffered: perAnimalOffered,
              quantityConsumed: perAnimalConsumed,
              unitCost: totalUC,
              totalCost: perCost,
            };
          });

          // Calculate totals
          const totalQuantityOffered = processedFeedItems.reduce((sum, fi) => sum + fi.quantityOffered, 0);
          const totalQuantityConsumed = processedFeedItems.reduce((sum, fi) => sum + fi.quantityConsumed, 0);
          const totalFeedCost = processedFeedItems.reduce((sum, fi) => sum + fi.totalCost, 0);

          const payload = {
            animalId,
            feedingData: {
              date: formData.date ? new Date(formData.date) : new Date(),
              feedItems: processedFeedItems,
              feedingMethod: formData.feedingMethod || undefined,
              location: formData.location || undefined,
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
      results.push(...animalResults);

      const successCount = results.filter(Boolean).length;
      const failCount = results.length - successCount;

      if (failCount > 0) setError(`${failCount} of ${results.length} records failed to save.`);
      setSuccess(`${successCount} feeding record${successCount > 1 ? "s" : ""} saved!`);
      setFormData({ ...initialFormState });
      setFeedItems([{ ...emptyFeedItem }]);
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

  const handleDelete = async (id) => {
    if (!confirm("Delete this feeding record?")) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/feeding/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Failed to delete");
      setSuccess("Deleted!");
      fetchAll();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  // Filtered records
  let filteredRecords = records.filter((record) => {
    const animalName = record.animal?.name || record.animal?.tagId || "";
    const matchSearch =
      searchTerm === "" ||
      (record.feedTypeName || record.feedCategory || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      animalName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchType = filterType === "all" || (record.feedTypeName || record.feedCategory) === filterType;
    return matchSearch && matchType;
  });
  filteredRecords = filterByPeriod(filteredRecords, filterPeriod);
  filteredRecords = filterByLocation(filteredRecords, filterLocation);

  const feedTypes = [...new Set(records.map((r) => r.feedTypeName || r.feedCategory).filter(Boolean))];

  // Stats
  const totalRecords = records.length;
  const totalFeedCost = records.reduce((sum, r) => sum + (r.totalCost || 0), 0);
  const totalConsumed = records.reduce((sum, r) => sum + (r.quantityConsumed || 0), 0);
  const todayRecords = records.filter((r) => {
    const d = new Date(r.date);
    return d.toDateString() === new Date().toDateString();
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
            onClick={() => { setShowForm(!showForm); setError(""); setEditingId(null); setFormData({ ...initialFormState }); setFeedItems([{ ...emptyFeedItem }]); }}
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors font-medium"
          >
            {showForm ? <FaTimes /> : <FaPlus />}
            {showForm ? "Cancel" : "Add Feeding"}
          </button>
        }
      />

      {/* Messages */}
      {error && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="error-message flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError("")} className="text-red-500 hover:text-red-700"><FaTimes /></button>
        </motion.div>
      )}
      {success && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="success-message">
          <FaCheck className="inline mr-2" />{success}
        </motion.div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Records", value: totalRecords, color: "blue" },
          { label: "Today's Feedings", value: todayRecords, color: "green" },
          { label: "Total Consumed", value: `${totalConsumed.toFixed(1)} units`, color: "amber" },
          { label: "Total Feed Cost", value: formatCurrency(totalFeedCost, businessSettings.currency), color: "red" },
        ].map((s) => (
          <div key={s.label} className={`bg-${s.color}-50 border border-${s.color}-200 rounded-xl p-4`}>
            <p className="text-sm text-gray-600">{s.label}</p>
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Form */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 overflow-hidden"
        >
          <div className="bg-amber-600 px-6 py-3">
            <h3 className="text-lg font-bold text-white">{editingId ? "Edit Feeding Record" : "Add Feeding Record"}</h3>
          </div>
          <div className="p-6 space-y-5">
            {/* Feeding Mode Toggle - only show for new records */}
            {!editingId && (
              <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4">
                <h4 className="font-bold text-amber-900 mb-3 flex items-center gap-2">🔄 Feeding Mode</h4>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => setFeedingMode("individual")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      feedingMode === "individual" ? "bg-amber-600 text-white" : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
                    }`}
                  >
                    <FaUser size={12} /> Individual
                  </button>
                  <button
                    type="button"
                    onClick={() => setFeedingMode("group")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      feedingMode === "group" ? "bg-amber-600 text-white" : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
                    }`}
                  >
                    <FaUsers size={12} /> Group Feeding
                  </button>
                </div>
              </div>
            )}

            {/* Animal Selection */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
              <h4 className="font-bold text-blue-900 mb-3 flex items-center gap-2">🐐 Animal Selection</h4>
              {feedingMode === "individual" || editingId ? (
                <div>
                  <label className="label">Select Animal *</label>
                  <select value={selectedAnimalId} onChange={(e) => setSelectedAnimalId(e.target.value)} className="input-field" disabled={!!editingId}>
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
                    <label className="label mb-0">Select Animals ({selectedGroupIds.length} selected)</label>
                    <button type="button" onClick={handleSelectAll} className="text-sm text-amber-600 hover:text-amber-800 font-medium">
                      {groupSelectAll ? "Deselect All" : "Select All"}
                    </button>
                  </div>
                  <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1">
                    {aliveAnimals.map((a) => (
                      <label key={a._id} className="flex items-center gap-2 px-2 py-1 hover:bg-amber-50 rounded cursor-pointer text-sm">
                        <input type="checkbox" checked={selectedGroupIds.includes(a._id)} onChange={() => handleToggleGroupAnimal(a._id)} className="w-4 h-4 text-amber-600 rounded" />
                        <span className="truncate">{a.name || a.tagId} {a.currentWeight ? `(${a.currentWeight}kg)` : ""}</span>
                      </label>
                    ))}
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-semibold text-gray-700">Distribution:</span>
                    <label className="flex items-center gap-1 text-sm cursor-pointer">
                      <input type="radio" name="distribution" checked={distributionMethod === "equal"} onChange={() => setDistributionMethod("equal")} className="text-amber-600" /> Equal Split
                    </label>
                    <label className="flex items-center gap-1 text-sm cursor-pointer">
                      <input type="radio" name="distribution" checked={distributionMethod === "byWeight"} onChange={() => setDistributionMethod("byWeight")} className="text-amber-600" /> By Body Weight
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Feed Details - Multiple Items */}
            <form onSubmit={handleSubmit}>
              <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-green-900 flex items-center gap-2">🌾 Feed Items</h4>
                  {!editingId && (
                    <button type="button" onClick={addFeedItem} className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors">
                      <FaPlus size={10} /> Add Item
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  {/* Date and common fields */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="label">Date</label>
                      <input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="input-field" />
                    </div>
                    <div>
                      <label className="label">Feeding Method</label>
                      <select value={formData.feedingMethod} onChange={(e) => setFormData({ ...formData, feedingMethod: e.target.value })} className="input-field">
                        <option value="">-- Select --</option>
                        {FEEDING_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="label">Location</label>
                      <select value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} className="input-field">
                        <option value="">-- Select Location --</option>
                        {locations.map((loc) => <option key={loc._id} value={loc._id}>{loc.name}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Feed items list */}
                  {feedItems.map((fi, idx) => (
                    <div key={idx} className={`bg-white border ${feedItems.length > 1 ? "border-green-300" : "border-gray-200"} rounded-lg p-4 ${feedItems.length > 1 ? "relative" : ""}`}>
                      {feedItems.length > 1 && (
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-green-700">Feed Item #{idx + 1}</span>
                          <button type="button" onClick={() => removeFeedItem(idx)} className="text-red-500 hover:text-red-700 text-xs font-medium flex items-center gap-1">
                            <FaTimes size={10} /> Remove
                          </button>
                        </div>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                          <label className="label">Feed Inventory Item</label>
                          <select value={fi.inventoryItem} onChange={(e) => handleInventorySelect(e.target.value, idx)} className="input-field">
                            <option value="">-- Select Feed Item --</option>
                            {feedInventory.map((item) => (
                              <option key={item._id} value={item._id}>{item.item} (Stock: {item.quantity})</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="label">Feed Category *</label>
                          <input type="text" value={fi.feedCategory} onChange={(e) => {
                            const updated = [...feedItems];
                            updated[idx] = { ...updated[idx], feedCategory: e.target.value };
                            setFeedItems(updated);
                          }} placeholder="Hay, Grain, Supplement..." className="input-field" required />
                        </div>
                        <div>
                          <label className="label">Qty Offered {feedingMode === "group" && !editingId ? "(Total)" : ""}</label>
                          <input type="number" step="0.01" min="0" value={fi.quantityOffered} onChange={(e) => {
                            const updated = [...feedItems];
                            updated[idx] = { ...updated[idx], quantityOffered: e.target.value };
                            setFeedItems(updated);
                          }} placeholder="e.g., 10" className="input-field" />
                        </div>
                        <div>
                          <label className="label">Qty Consumed {feedingMode === "group" && !editingId ? "(Total)" : ""}</label>
                          <input type="number" step="0.01" min="0" value={fi.quantityConsumed} onChange={(e) => recalcTotal("quantityConsumed", e.target.value, idx)} placeholder="e.g., 8" className="input-field" />
                        </div>
                        <div>
                          <label className="label">Unit Cost</label>
                          <input type="number" step="0.01" min="0" value={fi.unitCost} onChange={(e) => recalcTotal("unitCost", e.target.value, idx)} placeholder="Auto from inventory" className="input-field" />
                        </div>
                        <div>
                          <label className="label">Total Cost</label>
                          <input type="number" step="0.01" value={fi.totalCost} readOnly className="input-field bg-gray-50" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-4 mt-4">
                <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">📝 Notes</h4>
                <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={2} placeholder="Optional notes..." className="input-field" />
              </div>

              {/* Group summary */}
              {feedingMode === "group" && !editingId && selectedGroupIds.length > 1 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800 mt-4">
                  <strong>Group Summary:</strong> {selectedGroupIds.length} animals selected, {feedItems.filter(fi => fi.feedCategory).length} feed item(s).{" "}
                  {distributionMethod === "equal"
                    ? `Each animal gets ${((feedItems.reduce((sum, fi) => sum + (parseFloat(fi.quantityConsumed) || 0), 0)) / selectedGroupIds.length).toFixed(2)} total units.`
                    : "Feed distributed proportionally by body weight."}
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3 mt-4 pt-4 border-t">
                <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" disabled={formLoading} className="flex items-center gap-2 px-6 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium disabled:opacity-60">
                  {formLoading ? <FaSpinner className="animate-spin" /> : <FaCheck />}
                  {editingId ? "Update Record" : feedingMode === "group" ? `Feed ${selectedGroupIds.length} Animals` : "Save Record"}
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      )}

      {/* Filter Bar */}
      <FilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        placeholder="Search by feed type or animal..."
        filters={[
          { value: filterType, onChange: setFilterType, options: [{ value: "all", label: "All Feed Types" }, ...feedTypes.map((t) => ({ value: t, label: t }))] },
          { value: filterPeriod, onChange: setFilterPeriod, options: PERIOD_OPTIONS },
          { value: filterLocation, onChange: setFilterLocation, options: [{ value: "all", label: "All Locations" }, ...locations.map((l) => ({ value: l._id, label: l.name }))] },
        ]}
      />

      {/* Records Table */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        {filteredRecords.length === 0 ? (
          <div className="text-center py-16">
            <span className="text-5xl mb-4 block">🌾</span>
            <p className="text-gray-500 text-lg">No feeding records found</p>
            <p className="text-gray-400 text-sm mt-1">Click &quot;Add Feeding&quot; to create a record</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b-2 border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-900 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-900 uppercase">Animal</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-900 uppercase">Feed Type</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-gray-900 uppercase">Offered</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-gray-900 uppercase">Consumed</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-900 uppercase">Method</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-900 uppercase">Location</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-gray-900 uppercase">Cost</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-gray-900 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredRecords.map((record, idx) => (
                  <motion.tr key={record._id || idx} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.02 }} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">{record.date ? new Date(record.date).toLocaleDateString() : "—"}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">{record.animal?.name || record.animal?.tagId || "—"}</td>
                    <td className="px-4 py-3 text-sm">
                      {record.feedItems && record.feedItems.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {record.feedItems.map((fi, fidx) => (
                            <span key={fidx} className="bg-amber-100 text-amber-800 px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap">
                              {fi.feedTypeName || "—"}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-700">{record.totalQuantityOffered ?? record.quantityOffered ?? "—"}</td>
                    <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">{record.totalQuantityConsumed ?? record.quantityConsumed ?? "—"}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{record.feedingMethod || "—"}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{record.location?.name || "—"}</td>
                    <td className="px-4 py-3 text-sm text-right font-semibold text-orange-700">{formatCurrency(record.totalFeedCost || record.totalCost || 0, businessSettings.currency)}</td>
                    <td className="px-4 py-3 text-sm text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => handleEdit(record)} className="p-1.5 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-lg" title="Edit">
                          <FaEdit size={13} />
                        </button>
                        <button onClick={() => handleDelete(record._id)} className="p-1.5 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg" title="Delete">
                          <FaTrash size={13} />
                        </button>
                      </div>
                    </td>
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
