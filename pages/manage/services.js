import { useState, useEffect, useContext } from "react";
import { motion } from "framer-motion";
import {
  FaTools, FaPlus, FaTimes, FaSpinner, FaEdit, FaCheck, FaTrash, FaToggleOn, FaToggleOff
} from "react-icons/fa";
import PageHeader from "@/components/shared/PageHeader";
import FilterBar from "@/components/shared/FilterBar";
import { BusinessContext } from "@/context/BusinessContext";
import { formatCurrency } from "@/utils/formatting";
import { useRole } from "@/hooks/useRole";
import Loader from "@/components/Loader";

const SERVICE_CATEGORIES = [
  "Veterinary Services",
  "Breeding Services",
  "Feed & Nutrition",
  "Training & Consultation",
  "Processing & Value Addition",
  "Equipment & Facilities",
  "Animal Sales",
  "Waste Management",
  "Other",
];

const categoryColors = {
  "Veterinary Services": "bg-red-100 text-red-800",
  "Breeding Services": "bg-pink-100 text-pink-800",
  "Feed & Nutrition": "bg-yellow-100 text-yellow-800",
  "Training & Consultation": "bg-indigo-100 text-indigo-800",
  "Processing & Value Addition": "bg-purple-100 text-purple-800",
  "Equipment & Facilities": "bg-blue-100 text-blue-800",
  "Animal Sales": "bg-green-100 text-green-800",
  "Waste Management": "bg-orange-100 text-orange-800",
  "Other": "bg-gray-100 text-gray-800",
};

const emptyForm = {
  name: "",
  category: "",
  description: "",
  price: "",
  unit: "",
  showOnSite: false,
  isActive: true,
  notes: "",
};

export default function ManageServices() {
  const { businessSettings } = useContext(BusinessContext);
  const { user } = useRole();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [form, setForm] = useState({ ...emptyForm });
  const [editingId, setEditingId] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const canEdit = user?.role === "SuperAdmin" || user?.role === "Manager";

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/services", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch services");
      const data = await res.json();
      setServices(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const url = editingId ? `/api/services/${editingId}` : "/api/services";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...form,
          price: parseFloat(form.price) || 0,
        }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to save service");
      }
      setSuccess(editingId ? "Service updated!" : "Service added!");
      setForm({ ...emptyForm });
      setEditingId(null);
      setShowForm(false);
      fetchServices();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = (service) => {
    setForm({
      name: service.name || "",
      category: service.category || "",
      description: service.description || "",
      price: service.price || "",
      unit: service.unit || "",
      showOnSite: service.showOnSite || false,
      isActive: service.isActive !== false,
      notes: service.notes || "",
    });
    setEditingId(service._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this service permanently?")) return;
    setDeleting(id);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/services/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to delete");
      }
      setSuccess("Service deleted!");
      fetchServices();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleting(null);
    }
  };

  const handleToggleShowOnSite = async (service) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/services/${service._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ showOnSite: !service.showOnSite }),
      });
      if (!res.ok) throw new Error("Failed to update");
      fetchServices();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleToggleActive = async (service) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/services/${service._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive: !service.isActive }),
      });
      if (!res.ok) throw new Error("Failed to update");
      fetchServices();
    } catch (err) {
      setError(err.message);
    }
  };

  // Filtered list
  const filtered = services.filter((s) => {
    const matchSearch =
      s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.unit?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategory = filterCategory === "all" || s.category === filterCategory;
    return matchSearch && matchCategory;
  });

  // Stats
  const totalServices = services.length;
  const activeServices = services.filter((s) => s.isActive !== false).length;
  const shownOnSite = services.filter((s) => s.showOnSite).length;
  const avgPrice = totalServices > 0 ? services.reduce((sum, s) => sum + (s.price || 0), 0) / totalServices : 0;

  if (loading) return <Loader />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Services"
        subtitle="Manage farm services and offerings"
        icon={FaTools}
        actions={
          canEdit && (
            <button
              onClick={() => {
                setForm({ ...emptyForm });
                setEditingId(null);
                setShowForm(!showForm);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
            >
              {showForm ? <FaTimes /> : <FaPlus />}
              {showForm ? "Cancel" : "Add Service"}
            </button>
          )
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

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Services", value: totalServices, color: "blue" },
          { label: "Active", value: activeServices, color: "green" },
          { label: "Shown on Site", value: shownOnSite, color: "purple" },
          { label: "Avg Price", value: formatCurrency(avgPrice, businessSettings.currency), color: "yellow" },
        ].map((stat) => (
          <div key={stat.label} className={`bg-${stat.color}-50 border border-${stat.color}-200 rounded-xl p-4`}>
            <p className="text-sm text-gray-600">{stat.label}</p>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Add/Edit Form */}
      {showForm && canEdit && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-white rounded-xl shadow-lg border border-gray-200 p-6"
        >
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            {editingId ? "Edit Service" : "Add New Service"}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Service Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                  required
                  placeholder="e.g., Veterinary Check-up"
                />
              </div>
              {/* Category */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                >
                  <option value="">-- Select Category --</option>
                  {SERVICE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              {/* Price */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Price</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                  placeholder="0.00"
                />
              </div>
              {/* Unit */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Unit</label>
                <input
                  type="text"
                  value={form.unit}
                  onChange={(e) => setForm({ ...form, unit: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                  placeholder="e.g., per head, per visit, per kg"
                />
              </div>
              {/* Description */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                  rows={2}
                  placeholder="Describe the service..."
                />
              </div>
              {/* Notes */}
              <div className="md:col-span-2 lg:col-span-3">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                  rows={2}
                  placeholder="Additional notes..."
                />
              </div>
            </div>
            {/* Toggles */}
            <div className="flex items-center gap-8">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.showOnSite}
                  onChange={(e) => setForm({ ...form, showOnSite: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-sm font-medium text-gray-700">Show on Site</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="w-4 h-4 text-green-600 rounded"
                />
                <span className="text-sm font-medium text-gray-700">Active</span>
              </label>
            </div>
            {/* Submit */}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => { setShowForm(false); setEditingId(null); setForm({ ...emptyForm }); }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={formLoading}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-60"
              >
                {formLoading ? <FaSpinner className="animate-spin" /> : <FaCheck />}
                {editingId ? "Update Service" : "Add Service"}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Filter Bar */}
      <FilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        placeholder="Search services..."
        filters={[
          {
            value: filterCategory,
            onChange: setFilterCategory,
            options: [
              { value: "all", label: "All Categories" },
              ...SERVICE_CATEGORIES.map((c) => ({ value: c, label: c })),
            ],
          },
        ]}
      />

      {/* Table */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <FaTools className="mx-auto mb-4 text-gray-300" size={48} />
            <p className="text-gray-500 text-lg">No services found</p>
            {canEdit && (
              <button
                onClick={() => { setShowForm(true); setEditingId(null); setForm({ ...emptyForm }); }}
                className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
              >
                Add First Service
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b-2 border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">Service Name</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">Unit</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-900 uppercase tracking-wider">Active</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-900 uppercase tracking-wider">Show on Site</th>
                  {canEdit && <th className="px-6 py-4 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filtered.map((service, index) => (
                  <motion.tr
                    key={service._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.03 }}
                    className={`hover:bg-gray-50 transition-colors ${service.isActive === false ? 'opacity-50' : ''}`}
                  >
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">{service.name}</td>
                    <td className="px-6 py-4 text-sm">
                      {service.category ? (
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${categoryColors[service.category] || 'bg-gray-100 text-gray-800'}`}>
                          {service.category}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                      {formatCurrency(parseFloat(service.price || 0), businessSettings.currency)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">{service.unit || "—"}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">{service.description || "—"}</td>
                    {/* Active Toggle */}
                    <td className="px-6 py-4 text-sm text-center">
                      {canEdit ? (
                        <button
                          onClick={() => handleToggleActive(service)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${service.isActive !== false ? 'bg-green-500' : 'bg-gray-300'}`}
                          title={service.isActive !== false ? 'Active' : 'Inactive'}
                        >
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${service.isActive !== false ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                      ) : (
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${service.isActive !== false ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {service.isActive !== false ? 'Yes' : 'No'}
                        </span>
                      )}
                    </td>
                    {/* Show on Site Toggle */}
                    <td className="px-6 py-4 text-sm text-center">
                      {canEdit ? (
                        <button
                          onClick={() => handleToggleShowOnSite(service)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${service.showOnSite ? 'bg-blue-500' : 'bg-gray-300'}`}
                          title={service.showOnSite ? 'Visible on site' : 'Hidden from site'}
                        >
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${service.showOnSite ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                      ) : (
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${service.showOnSite ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                          {service.showOnSite ? 'Yes' : 'No'}
                        </span>
                      )}
                    </td>
                    {/* Actions */}
                    {canEdit && (
                      <td className="px-6 py-4 text-sm">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(service)}
                            className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-lg transition-colors"
                            title="Edit service"
                          >
                            <FaEdit size={14} />
                          </button>
                          {user?.role === "SuperAdmin" && (
                            <button
                              onClick={() => handleDelete(service._id)}
                              disabled={deleting === service._id}
                              className="p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-colors disabled:opacity-50"
                              title="Delete service"
                            >
                              {deleting === service._id ? <FaSpinner className="animate-spin" size={14} /> : <FaTrash size={14} />}
                            </button>
                          )}
                        </div>
                      </td>
                    )}
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
