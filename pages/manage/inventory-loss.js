"use client";

import { useState, useEffect, useContext } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { FaPlus, FaTimes, FaTrash } from "react-icons/fa";
import PageHeader from "@/components/shared/PageHeader";
import FilterBar from "@/components/shared/FilterBar";
import Loader from "@/components/Loader";
import { BusinessContext } from "@/context/BusinessContext";
import { formatCurrency } from "@/utils/formatting";
import { useRole } from "@/hooks/useRole";
import { getCachedData, invalidateCache } from "@/utils/cache";

const LOSS_TYPES = ["Wasted", "Damaged", "Lost", "Expired"];

const initialFormState = {
  inventoryItem: "",
  type: "",
  quantity: "",
  reason: "",
  date: "",
  notes: "",
};

export default function InventoryLossPage() {
  const router = useRouter();
  const { businessSettings } = useContext(BusinessContext);
  const { user } = useRole();
  const [records, setRecords] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [formData, setFormData] = useState(initialFormState);

  const canEdit = user && ["SuperAdmin", "Manager"].includes(user.role);
  const canDelete = user?.role === "SuperAdmin";

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    fetchRecords();
    fetchInventory();
  }, [router]);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const data = await getCachedData("api/inventory-loss", async () => {
        const res = await fetch("/api/inventory-loss", {
          headers: { Authorization: `Bearer ${token}` },
        });
        return res.ok ? await res.json() : [];
      }, 3 * 60 * 1000);
      setRecords(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch loss records:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchInventory = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/inventory", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setInventory(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Failed to fetch inventory:", err);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setSuccess("");

    if (!formData.inventoryItem || !formData.type || !formData.quantity) {
      setFormError("Inventory item, type, and quantity are required.");
      return;
    }

    try {
      setFormLoading(true);
      const token = localStorage.getItem("token");
      const selectedItem = inventory.find((i) => i._id === formData.inventoryItem);

      const payload = {
        inventoryItem: formData.inventoryItem,
        itemName: selectedItem?.item || "",
        type: formData.type,
        quantity: Number(formData.quantity),
        date: formData.date ? new Date(formData.date) : new Date(),
        reason: formData.reason || "",
        reportedBy: user?.name || "",
        notes: formData.notes || "",
      };

      const res = await fetch("/api/inventory-loss", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        setFormError(data?.error || "Failed to record loss.");
        return;
      }

      setSuccess("Loss record created successfully!");
      setFormData(initialFormState);
      setShowForm(false);
      fetchRecords();
      fetchInventory();
    } catch (err) {
      console.error("Failed to save loss record:", err);
      setFormError("Failed to save loss record.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this loss record?")) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/inventory-loss/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        fetchRecords();
      }
    } catch (err) {
      console.error("Failed to delete loss record:", err);
    }
  };

  const filteredRecords = records.filter((record) => {
    const matchesSearch =
      !searchTerm ||
      (record.itemName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (record.reason || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || record.type === filterType;
    return matchesSearch && matchesType;
  });

  const totalLoss = filteredRecords.reduce((sum, r) => sum + (r.totalLoss || 0), 0);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Inventory Losses"
        subtitle="Track wasted, damaged, lost, and expired inventory items"
        gradient="from-red-600 to-red-700"
        icon="📉"
      />

      <FilterBar
        searchPlaceholder="Search by item name or reason..."
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filterOptions={[
          { value: "all", label: "All Types" },
          ...LOSS_TYPES.map((type) => ({ value: type, label: type })),
        ]}
        filterValue={filterType}
        onFilterChange={setFilterType}
        showAddButton={canEdit}
        onAddClick={() => setShowForm(!showForm)}
        isAddActive={showForm}
      />

      {/* Summary */}
      <div className="bg-white rounded-2xl shadow-lg border-2 border-red-100 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-red-50 rounded-xl p-4 border border-red-200 text-center">
            <p className="text-sm text-gray-600">Total Loss Records</p>
            <p className="text-2xl font-bold text-red-700">{filteredRecords.length}</p>
          </div>
          <div className="bg-orange-50 rounded-xl p-4 border border-orange-200 text-center">
            <p className="text-sm text-gray-600">Total Quantity Lost</p>
            <p className="text-2xl font-bold text-orange-700">{filteredRecords.reduce((s, r) => s + (r.quantity || 0), 0)}</p>
          </div>
          <div className="bg-red-50 rounded-xl p-4 border border-red-200 text-center">
            <p className="text-sm text-gray-600">Total Financial Loss</p>
            <p className="text-2xl font-bold text-red-700">{formatCurrency(totalLoss, businessSettings.currency)}</p>
          </div>
        </div>
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-green-700 text-sm font-semibold">
          {success}
        </div>
      )}

      {/* Form */}
      {showForm && canEdit && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg border-2 border-red-100 p-6"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-800">Record Inventory Loss</h3>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="text-gray-500 hover:text-gray-700"
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
                <label className="block text-xs font-semibold text-gray-600 mb-1">Inventory Item *</label>
                <select
                  name="inventoryItem"
                  value={formData.inventoryItem}
                  onChange={handleFormChange}
                  required
                  className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="">Select Item</option>
                  {inventory.map((item) => (
                    <option key={item._id} value={item._id}>
                      {item.item} ({item.categoryName || item.category} - Qty: {item.quantity})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Loss Type *</label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleFormChange}
                  required
                  className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="">Select Type</option>
                  {LOSS_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Quantity *</label>
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleFormChange}
                  required
                  min="0"
                  step="0.01"
                  placeholder="e.g., 5"
                  className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Date</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Reason</label>
                <input
                  type="text"
                  name="reason"
                  value={formData.reason}
                  onChange={handleFormChange}
                  placeholder="Why was it lost/damaged?"
                  className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Notes</label>
                <input
                  type="text"
                  name="notes"
                  value={formData.notes}
                  onChange={handleFormChange}
                  placeholder="Additional details..."
                  className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={formLoading}
              className="w-full md:w-auto inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-60"
            >
              <FaPlus />
              {formLoading ? "Saving..." : "Record Loss"}
            </button>
          </form>
        </motion.div>
      )}

      {/* Records Table */}
      {loading ? (
        <Loader message="Loading loss records..." color="red-600" />
      ) : filteredRecords.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center border-2 border-gray-200">
          <p className="text-gray-500 text-lg">No loss records found</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-red-50 to-red-100">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Item</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Type</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Quantity</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Unit Cost</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Total Loss</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Date</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Reason</th>
                {canDelete && <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredRecords.map((record, idx) => {
                const typeColors = {
                  Wasted: "bg-yellow-100 text-yellow-800",
                  Damaged: "bg-orange-100 text-orange-800",
                  Lost: "bg-red-100 text-red-800",
                  Expired: "bg-gray-100 text-gray-800",
                };
                return (
                  <motion.tr
                    key={record._id || idx}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.03 }}
                    className="hover:bg-red-50 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{record.itemName || "Unknown"}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${typeColors[record.type] || "bg-gray-100 text-gray-800"}`}>
                        {record.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 font-semibold">{record.quantity}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{formatCurrency(record.unitCost || 0, businessSettings.currency)}</td>
                    <td className="px-6 py-4 text-sm font-bold text-red-700">{formatCurrency(record.totalLoss || 0, businessSettings.currency)}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{record.date ? new Date(record.date).toLocaleDateString() : "N/A"}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{record.reason || "—"}</td>
                    {canDelete && (
                      <td className="px-6 py-4 text-sm">
                        <button
                          onClick={() => handleDelete(record._id)}
                          className="p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <FaTrash size={14} />
                        </button>
                      </td>
                    )}
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

InventoryLossPage.layoutType = "default";
InventoryLossPage.layoutProps = { title: "Inventory Losses" };
