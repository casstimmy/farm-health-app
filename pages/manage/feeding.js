"use client";

import { useState, useEffect, useMemo, useContext } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { FaPlus, FaTimes } from "react-icons/fa";
import PageHeader from "@/components/shared/PageHeader";
import FilterBar from "@/components/shared/FilterBar";
import Loader from "@/components/Loader";
import { BusinessContext } from "@/context/BusinessContext";
import { formatCurrency } from "@/utils/formatting";

const initialFormState = {
  date: "",
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
  const [animals, setAnimals] = useState([]);
  const [selectedAnimalId, setSelectedAnimalId] = useState("");
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [formData, setFormData] = useState(initialFormState);
  const [feedInventory, setFeedInventory] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    fetchAnimals();
    fetchFeedInventory();
  }, [router]);

  useEffect(() => {
    if (!selectedAnimalId) return;
    fetchRecords(selectedAnimalId);
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

  const fetchFeedInventory = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/inventory", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const feeds = (Array.isArray(data) ? data : []).filter(
          (item) => (item.categoryName || item.category || "").toLowerCase() === "feed"
        );
        setFeedInventory(feeds);
      }
    } catch (err) {
      console.error("Failed to fetch feed inventory:", err);
    }
  };

  const fetchRecords = async (animalId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/feeding?animalId=${animalId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setRecords(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Failed to fetch feeding records:", err);
    } finally {
      setLoading(false);
    }
  };

  const selectedAnimal = useMemo(
    () => animals.find((a) => a._id === selectedAnimalId),
    [animals, selectedAnimalId]
  );

  const filteredRecords = records.filter((record) => {
    const matchesSearch =
      searchTerm === "" ||
      record.feedCategory?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      selectedAnimal?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      selectedAnimal?.tagId?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || record.feedCategory === filterType;
    return matchesSearch && matchesType;
  });

  const feedTypes = [...new Set(records.map((r) => r.feedCategory).filter(Boolean))];

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

    if (!formData.feedCategory.trim()) {
      setFormError("Feed category is required.");
      return;
    }

    try {
      setFormLoading(true);
      const token = localStorage.getItem("token");
      const payload = {
        animalId: selectedAnimalId,
        feedingData: {
          date: formData.date ? new Date(formData.date) : new Date(),
          feedCategory: formData.feedCategory.trim(),
          inventoryItem: formData.inventoryItem || undefined,
          quantityOffered: formData.quantityOffered ? Number(formData.quantityOffered) : undefined,
          quantityConsumed: formData.quantityConsumed ? Number(formData.quantityConsumed) : undefined,
          unitCost: formData.unitCost ? Number(formData.unitCost) : 0,
          totalCost: formData.totalCost ? Number(formData.totalCost) : 0,
          feedingMethod: formData.feedingMethod.trim() || undefined,
          notes: formData.notes.trim() || undefined,
        },
      };

      const res = await fetch("/api/feeding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        setFormError(data?.error || "Failed to save feeding record.");
        return;
      }

      setFormData(initialFormState);
      setShowForm(false);
      fetchRecords(selectedAnimalId);
    } catch (err) {
      console.error("Failed to save feeding record:", err);
      setFormError("Failed to save feeding record.");
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <PageHeader
        title="Feeding Records"
        subtitle="Track and manage animal feeding schedules and nutrition"
        gradient="from-amber-600 to-amber-700"
        icon="🌾"
      />

      {/* Controls */}
      <FilterBar
        searchPlaceholder="Search by feed category or animal..."
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filterOptions={[
          { value: "all", label: "All Categories" },
          ...feedTypes.map((type) => ({ value: type, label: type })),
        ]}
        filterValue={filterType}
        onFilterChange={setFilterType}
        showAddButton={true}
        onAddClick={() => setShowForm(!showForm)}
        isAddActive={showForm}
      />

      {/* Animal Selector */}
      <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-gray-700">Selected Animal</p>
          <p className="text-xs text-gray-500">Choose an animal to view and record feedings</p>
        </div>
        <select
          value={selectedAnimalId}
          onChange={(e) => setSelectedAnimalId(e.target.value)}
          className="w-full md:w-80 px-3 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
        >
          {animals.length === 0 && <option value="">No animals found</option>}
          {animals.map((animal) => (
            <option key={animal._id} value={animal._id}>
              {animal.name ? `${animal.name} (${animal.tagId})` : animal.tagId}
            </option>
          ))}
        </select>
      </div>

      {/* Form */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg border-2 border-amber-100 p-6"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-800">Add Feeding Record</h3>
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
                  className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Feed Category</label>
                <input
                  type="text"
                  name="feedCategory"
                  value={formData.feedCategory}
                  onChange={handleFormChange}
                  placeholder="Hay, Grain, Supplement..."
                  className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Feed Inventory Item</label>
                <select
                  name="inventoryItem"
                  value={formData.inventoryItem}
                  onChange={(e) => {
                    const itemId = e.target.value;
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
                  }}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="">Select Feed Item (optional)</option>
                  {feedInventory.map((item) => (
                    <option key={item._id} value={item._id}>
                      {item.item} (Qty: {item.quantity} {item.unit || ""})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Quantity Offered</label>
                <input
                  type="number"
                  name="quantityOffered"
                  value={formData.quantityOffered}
                  onChange={handleFormChange}
                  step="0.01"
                  min="0"
                  placeholder="e.g., 2.5"
                  className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Quantity Consumed</label>
                <input
                  type="number"
                  name="quantityConsumed"
                  value={formData.quantityConsumed}
                  onChange={(e) => {
                    const qty = parseFloat(e.target.value) || 0;
                    const uc = parseFloat(formData.unitCost) || 0;
                    setFormData((prev) => ({
                      ...prev,
                      quantityConsumed: e.target.value,
                      totalCost: (uc * qty).toFixed(2),
                    }));
                  }}
                  step="0.01"
                  min="0"
                  placeholder="e.g., 2.0"
                  className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Unit Cost</label>
                <input
                  type="number"
                  name="unitCost"
                  value={formData.unitCost}
                  onChange={(e) => {
                    const uc = parseFloat(e.target.value) || 0;
                    const qty = parseFloat(formData.quantityConsumed) || 0;
                    setFormData((prev) => ({
                      ...prev,
                      unitCost: e.target.value,
                      totalCost: (uc * qty).toFixed(2),
                    }));
                  }}
                  step="0.01"
                  min="0"
                  placeholder="Auto from inventory"
                  className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Total Cost</label>
                <input
                  type="number"
                  name="totalCost"
                  value={formData.totalCost}
                  onChange={handleFormChange}
                  step="0.01"
                  min="0"
                  placeholder="Auto-calculated"
                  className="w-full px-3 py-2 rounded-lg bg-gray-50 border border-gray-300 text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Feeding Method</label>
                <input
                  type="text"
                  name="feedingMethod"
                  value={formData.feedingMethod}
                  onChange={handleFormChange}
                  placeholder="Trough, Hand-fed, Grazing..."
                  className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
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
                  className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={formLoading}
              className="w-full md:w-auto inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700 disabled:opacity-60"
            >
              <FaPlus />
              {formLoading ? "Saving..." : "Save Feeding Record"}
            </button>
          </form>
        </motion.div>
      )}

      {/* Records Grid */}
      {loading ? (
        <Loader message="Loading feeding records..." color="amber-600" />
      ) : filteredRecords.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-gray-100">
          <p className="text-gray-500 text-lg">No feeding records found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRecords.map((record, idx) => (
            <motion.div
              key={record._id || idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-6 hover:shadow-2xl transition-all hover:border-amber-200"
            >
              <div className="mb-4">
                <h3 className="font-bold text-lg text-gray-900">{record.feedCategory || "Feeding"}</h3>
                <p className="text-sm text-gray-600">
                  {selectedAnimal?.name || selectedAnimal?.tagId || "Animal"}
                </p>
              </div>
              <div className="space-y-2 text-sm text-gray-600">
                <p>
                  <span className="font-semibold">Offered:</span>{" "}
                  {record.quantityOffered ?? "N/A"}
                </p>
                <p>
                  <span className="font-semibold">Consumed:</span>{" "}
                  {record.quantityConsumed ?? "N/A"}
                </p>
                <p>
                  <span className="font-semibold">Date:</span>{" "}
                  {record.date ? new Date(record.date).toLocaleDateString() : "N/A"}
                </p>
                <p>
                  <span className="font-semibold">Method:</span> {record.feedingMethod || "N/A"}
                </p>
                {record.totalCost > 0 && (
                  <p>
                    <span className="font-semibold">Cost:</span>{" "}
                    <span className="text-orange-700 font-bold">
                      {formatCurrency(record.totalCost, businessSettings.currency)}
                    </span>
                  </p>
                )}
                <p>
                  <span className="font-semibold">Notes:</span> {record.notes || "N/A"}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

Feeding.layoutType = "default";
Feeding.layoutProps = { title: "Feeding Records" };
