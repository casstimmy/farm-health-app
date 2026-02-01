import { useState, useEffect, useContext } from "react";
import { motion } from "framer-motion";
import { FaBox, FaPlus, FaTimes, FaSpinner, FaEdit, FaCheck } from "react-icons/fa";
import PageHeader from "@/components/shared/PageHeader";
import FilterBar from "@/components/shared/FilterBar";
import { BusinessContext } from "@/context/BusinessContext";
import { formatCurrency } from "@/utils/formatting";
import { useRole } from "@/hooks/useRole";
import Loader from "@/components/Loader";

export default function ManageInventory() {
  const { businessSettings } = useContext(BusinessContext);
  const { user } = useRole();
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const canEdit = user && ["SuperAdmin", "Manager"].includes(user.role);
  const [formData, setFormData] = useState({
    name: "",
    quantity: "",
    category: "",
    minStock: "",
    price: ""
  });

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/inventory", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      setInventory(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching inventory:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setError("");
    setSuccess("");
    
    try {
      const token = localStorage.getItem("token");
      const payload = {
        item: formData.name,
        quantity: formData.quantity,
        category: formData.category,
        minStock: formData.minStock,
        price: formData.price
      };
      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setSuccess(`✓ ${formData.name} added to inventory!`);
        setFormData({ name: "", quantity: "", category: "", minStock: "", price: "" });
        setTimeout(() => {
          setShowForm(false);
          fetchInventory();
        }, 1000);
      } else {
        setError("Failed to add item");
      }
    } catch (error) {
      console.error("Error adding inventory:", error);
      setError("Error adding item to inventory");
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditItem = (item) => {
    setEditingId(item._id);
    setEditValue(item.item);
  };

  const handleSaveEdit = async () => {
    if (!editValue.trim()) {
      setError("Item name cannot be empty");
      return;
    }

    setEditSaving(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/inventory/${editingId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ item: editValue })
      });

      if (res.ok) {
        setSuccess("✓ Item name updated!");
        setEditingId(null);
        setEditValue("");
        setTimeout(() => setSuccess(""), 2000);
        fetchInventory();
      } else {
        setError("Failed to update item");
      }
    } catch (error) {
      console.error("Error updating item:", error);
      setError("Error updating item");
    } finally {
      setEditSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditValue("");
  };

  const categoryColors = {
    "Medication": "bg-red-100 text-red-800",
    "Equipment": "bg-blue-100 text-blue-800",
    "Medical Supplies": "bg-green-100 text-green-800",
    "Feed": "bg-yellow-100 text-yellow-800"
  };

  const filteredInventory = inventory.filter(item =>
    (searchTerm === "" || item.item?.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (filterCategory === "all" || item.category === filterCategory)
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      {/* Page Header */}
      <PageHeader
        title="Inventory Management"
        subtitle="Track farm supplies, equipment, and medication"
        gradient="from-purple-600 to-purple-700"
        icon="📦"
      />

      {/* Add Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Add New Item</h3>
          
          {error && <div className="error-message mb-6">{error}</div>}
          {success && <div className="success-message mb-6">{success}</div>}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Item Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                name="name"
                required
                placeholder="e.g., Antibiotics"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-green-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Quantity <span className="text-red-500">*</span></label>
              <input
                type="number"
                name="quantity"
                required
                placeholder="e.g., 100"
                value={formData.quantity}
                onChange={handleChange}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-green-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Category <span className="text-red-500">*</span></label>
              <select
                name="category"
                required
                value={formData.category}
                onChange={handleChange}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-green-600 focus:outline-none"
              >
                <option value="">Select Category</option>
                <option value="Medication">💊 Medication</option>
                <option value="Equipment">⚙️ Equipment</option>
                <option value="Medical Supplies">🏥 Medical Supplies</option>
                <option value="Feed">🌾 Feed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Min Stock <span className="text-red-500">*</span></label>
              <input
                type="number"
                name="minStock"
                required
                placeholder="e.g., 10"
                value={formData.minStock}
                onChange={handleChange}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-green-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Price <span className="text-red-500">*</span></label>
              <input
                type="number"
                name="price"
                required
                placeholder="e.g., 25.00"
                value={formData.price}
                onChange={handleChange}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-green-600 focus:outline-none"
              />
            </div>
          </div>

          <div className="mt-8">
            <button
              type="submit"
              disabled={formLoading}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold disabled:opacity-60"
            >
              {formLoading ? (
                <>
                  <FaSpinner className="animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Item"
              )}
            </button>
          </div>
        </form>
      )}

      {/* Controls */}
      <FilterBar
        searchPlaceholder="Search by item name..."
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filterOptions={[
          { value: "all", label: "All Categories" },
          { value: "Medication", label: "Medication" },
          { value: "Equipment", label: "Equipment" },
          { value: "Medical Supplies", label: "Medical Supplies" },
          { value: "Feed", label: "Feed" },
        ]}
        filterValue={filterCategory}
        onFilterChange={setFilterCategory}
        showAddButton={true}
        onAddClick={() => setShowForm(!showForm)}
        isAddActive={showForm}
      />

      {/* Inventory Table */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
        {loading ? (
          <Loader message="Loading inventory..." color="purple-600" />
        ) : filteredInventory.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
            <FaBox className="text-5xl mb-3 mx-auto text-gray-400" />
            <p className="text-gray-700 font-semibold text-lg">No inventory items found</p>
            <p className="text-gray-500 text-sm mt-2">Try adjusting your search or category filter</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">Item Name</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">Quantity</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">Min Stock</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredInventory.map((item, index) => (
                  <motion.tr
                    key={item._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                      {editingId === item._id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="w-full px-3 py-1 border-2 border-blue-500 rounded-lg focus:outline-none"
                            autoFocus
                          />
                          <button
                            onClick={handleSaveEdit}
                            disabled={editSaving}
                            className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-60"
                            title="Save"
                          >
                            {editSaving ? <FaSpinner className="animate-spin" size={14} /> : <FaCheck size={14} />}
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
                            title="Cancel"
                          >
                            <FaTimes size={14} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between group">
                          <span>{item.item}</span>
                          {canEdit && (
                            <button
                              onClick={() => handleEditItem(item)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-blue-600 hover:bg-blue-100 rounded-lg"
                              title="Edit item name"
                            >
                              <FaEdit size={14} />
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${categoryColors[item.category] || 'bg-gray-100 text-gray-800'}`}>
                        {item.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="bg-blue-100 text-blue-800 px-4 py-2 rounded-lg font-bold text-sm">
                        {item.quantity}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 font-medium">
                      {item.minStock || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                      {formatCurrency(parseFloat(item.price || 0), businessSettings.currency)}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  );
}

ManageInventory.layoutType = "default";
ManageInventory.layoutProps = { title: "Inventory Management" };
