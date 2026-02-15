import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FaPlus, FaEdit, FaCheck, FaTimes, FaTrash, FaSpinner } from "react-icons/fa";
import PageHeader from "@/components/shared/PageHeader";
import Loader from "@/components/Loader";
import { useRole } from "@/hooks/useRole";

export default function InventoryCategories() {
  const { user } = useRole();
  const canEdit = user && ["SuperAdmin", "Manager"].includes(user.role);
  const canDelete = user?.role === "SuperAdmin";

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ name: "", description: "" });
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState({ name: "", description: "" });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/inventory-categories", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!formData.name.trim()) {
      setError("Category name is required");
      return;
    }
    setFormLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/inventory-categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setSuccess("✓ Category added");
        setFormData({ name: "", description: "" });
        fetchCategories();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to add category");
      }
    } catch (error) {
      console.error("Error creating category:", error);
      setError("Error creating category");
    } finally {
      setFormLoading(false);
    }
  };

  const startEdit = (category) => {
    setEditingId(category._id);
    setEditValue({ name: category.name, description: category.description || "" });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValue({ name: "", description: "" });
  };

  const saveEdit = async () => {
    setError("");
    setSuccess("");
    if (!editValue.name.trim()) {
      setError("Category name is required");
      return;
    }
    setFormLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/inventory-categories/${editingId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(editValue)
      });
      if (res.ok) {
        setSuccess("✓ Category updated");
        setEditingId(null);
        setEditValue({ name: "", description: "" });
        fetchCategories();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to update category");
      }
    } catch (error) {
      console.error("Error updating category:", error);
      setError("Error updating category");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this category? This does not delete inventory items.")) return;
    setError("");
    setSuccess("");
    setFormLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/inventory-categories/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        setSuccess("✓ Category deleted");
        fetchCategories();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to delete category");
      }
    } catch (error) {
      console.error("Error deleting category:", error);
      setError("Error deleting category");
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <PageHeader
        title="Inventory Categories"
        subtitle="Manage inventory categories for items and medications"
        gradient="from-green-600 to-green-700"
        icon="🏷️"
      />

      {canEdit && (
        <form onSubmit={handleCreate} className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Add Category</h3>
          {error && <div className="error-message mb-4">{error}</div>}
          {success && <div className="success-message mb-4">{success}</div>}
          <div className="flex flex-col md:flex-row items-end gap-3">
            <div className="flex-1 w-full">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Category Name *</label>
              <input
                type="text"
                name="name"
                placeholder="e.g. Feed, Medication"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-green-600 focus:outline-none"
              />
            </div>
            <div className="flex-[2] w-full">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
              <input
                type="text"
                name="description"
                placeholder="Optional description"
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-green-600 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={formLoading}
              className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold disabled:opacity-60 whitespace-nowrap"
            >
              {formLoading ? "Saving..." : "Add Category"}
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        {loading ? (
          <Loader message="Loading categories..." color="green-600" />
        ) : categories.length === 0 ? (
          <div className="text-center py-10 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
            <p className="text-gray-700 font-semibold">No categories found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-100 border-b-2 border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">Description</th>
                  {canEdit && <th className="px-4 py-3 text-right text-xs font-bold text-gray-900 uppercase tracking-wider">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {categories.map((cat) => (
                  <tr key={cat._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                      {editingId === cat._id ? (
                        <input
                          type="text"
                          value={editValue.name}
                          onChange={(e) => setEditValue((prev) => ({ ...prev, name: e.target.value }))}
                          className="w-full px-3 py-1 border-2 border-blue-500 rounded-lg"
                        />
                      ) : (
                        cat.name
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {editingId === cat._id ? (
                        <input
                          type="text"
                          value={editValue.description}
                          onChange={(e) => setEditValue((prev) => ({ ...prev, description: e.target.value }))}
                          className="w-full px-3 py-1 border-2 border-blue-500 rounded-lg"
                        />
                      ) : (
                        cat.description || "—"
                      )}
                    </td>
                    {canEdit && (
                      <td className="px-4 py-3 text-right">
                        {editingId === cat._id ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={saveEdit}
                              disabled={formLoading}
                              className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
                              title="Save"
                            >
                              {formLoading ? <FaSpinner className="animate-spin" size={14} /> : <FaCheck size={14} />}
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="p-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-lg"
                              title="Cancel"
                            >
                              <FaTimes size={14} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => startEdit(cat)}
                              className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg"
                              title="Edit"
                            >
                              <FaEdit size={14} />
                            </button>
                            {canDelete && (
                              <button
                                onClick={() => handleDelete(cat._id)}
                                className="p-2 text-red-600 hover:bg-red-100 rounded-lg"
                                title="Delete"
                              >
                                <FaTrash size={14} />
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  );
}

InventoryCategories.layoutType = "default";
InventoryCategories.layoutProps = { title: "Inventory Categories" };
