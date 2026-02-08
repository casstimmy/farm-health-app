import { useState, useEffect, useContext } from "react";
import { motion } from "framer-motion";
import { FaBox, FaPlus, FaTimes, FaSpinner, FaEdit, FaCheck, FaUpload, FaDatabase } from "react-icons/fa";
import PageHeader from "@/components/shared/PageHeader";
import FilterBar from "@/components/shared/FilterBar";
import { BusinessContext } from "@/context/BusinessContext";
import { formatCurrency } from "@/utils/formatting";
import { useRole } from "@/hooks/useRole";
import Loader from "@/components/Loader";
import Modal from "@/components/shared/Modal";

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
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState("");
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState("");
  const [lookupOptions, setLookupOptions] = useState({
    classCategory: [],
    purpose: [],
    recommendedDosage: [],
    route: [],
    supplier: [],
  });
  const [lookupLoading, setLookupLoading] = useState(true);
  const [showLookupInput, setShowLookupInput] = useState({
    classCategory: false,
    purpose: false,
    recommendedDosage: false,
    route: false,
    supplier: false,
  });
  const [newLookupValue, setNewLookupValue] = useState({
    classCategory: "",
    purpose: "",
    recommendedDosage: "",
    route: "",
    supplier: "",
  });
  const canEdit = user && ["SuperAdmin", "Manager"].includes(user.role);
  const [seeding, setSeeding] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    quantity: "",
    category: "",
    categoryId: "",
    minStock: "",
    price: "",
    unit: "",
    details: "",
    expiration: "",
    classCategory: "",
    purpose: "",
    recommendedDosage: "",
    route: "",
    supplier: "",
  });

  useEffect(() => {
    fetchInventory();
    fetchCategories();
    fetchLookupOptions();
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
      setCategoriesLoading(false);
    }
  };

  const fetchLookupOptions = async () => {
    try {
      const token = localStorage.getItem("token");
      const types = ["classCategory", "purpose", "recommendedDosage", "route", "supplier"];
      const results = await Promise.all(
        types.map((type) =>
          fetch(`/api/medication-lookups?type=${encodeURIComponent(type)}`, {
            headers: { "Authorization": `Bearer ${token}` }
          }).then((res) => res.json())
        )
      );
      const mapped = {};
      types.forEach((type, index) => {
        mapped[type] = Array.isArray(results[index]) ? results[index] : [];
      });
      setLookupOptions(mapped);
    } catch (error) {
      console.error("Error fetching medication lookups:", error);
    } finally {
      setLookupLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLookupSelectChange = (field, value) => {
    if (value === "__add_new__") {
      setShowLookupInput((prev) => ({ ...prev, [field]: true }));
      setFormData((prev) => ({ ...prev, [field]: "" }));
      return;
    }
    setShowLookupInput((prev) => ({ ...prev, [field]: false }));
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveLookup = async (field) => {
    const value = newLookupValue[field]?.trim();
    if (!value) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/medication-lookups", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ type: field, value })
      });

      if (res.ok) {
        const created = await res.json();
        setLookupOptions((prev) => ({
          ...prev,
          [field]: [...(prev[field] || []), created].sort((a, b) =>
            a.value.localeCompare(b.value)
          ),
        }));
        setFormData((prev) => ({ ...prev, [field]: created.value }));
        setNewLookupValue((prev) => ({ ...prev, [field]: "" }));
        setShowLookupInput((prev) => ({ ...prev, [field]: false }));
      }
    } catch (error) {
      console.error("Error saving lookup:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setError("");
    setSuccess("");
    
    try {
      const selectedCategory = categories.find((c) => c._id === formData.categoryId) || null;
      const categoryName = selectedCategory?.name || formData.category;
      const token = localStorage.getItem("token");
      const payload = {
        item: formData.name,
        quantity: formData.quantity,
        category: categoryName,
        categoryId: selectedCategory?._id,
        categoryName,
        minStock: formData.minStock,
        price: formData.price,
        unit: formData.unit,
      };

      if (categoryName === "Medication") {
        payload.medication = {
          details: formData.details,
          expiration: formData.expiration || undefined,
          classCategory: formData.classCategory,
          purpose: formData.purpose,
          recommendedDosage: formData.recommendedDosage,
          route: formData.route,
          supplier: formData.supplier,
        };
      }
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
        setFormData({
          name: "",
          quantity: "",
          category: "",
          categoryId: "",
          minStock: "",
          price: "",
          unit: "",
          details: "",
          expiration: "",
          classCategory: "",
          purpose: "",
          recommendedDosage: "",
          route: "",
          supplier: "",
        });
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

  const parseImportText = (text) => {
    const lines = text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length === 0) return [];

    return lines.map((line) => {
      const parts = line.split(/\t+/).map((p) => p.trim());
      return {
        name: parts[0] || "",
        details: parts[1] || "",
        expiration: parts[2] || "",
        classCategory: parts[3] || "",
        purpose: parts[4] || "",
        recommendedDosage: parts[5] || "",
        route: parts[6] || "",
        supplier: parts[7] || "",
      };
    }).filter((item) => item.name);
  };

  const handleImport = async () => {
    setImportError("");
    const items = parseImportText(importText);
    if (items.length === 0) {
      setImportError("No valid rows found. Paste tab-separated rows with a medication name.");
      return;
    }

    setImportLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/medications/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ items })
      });

      if (res.ok) {
        setShowImportModal(false);
        setImportText("");
        fetchInventory();
      } else {
        const data = await res.json();
        setImportError(data.error || "Failed to import medications");
      }
    } catch (error) {
      console.error("Error importing medications:", error);
      setImportError("Error importing medications");
    } finally {
      setImportLoading(false);
    }
  };

  const handleSeedInventory = async () => {
    if (!confirm("This will clear ALL existing inventory and medications, then seed with default medication data. Are you sure?")) {
      return;
    }
    setSeeding(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/seed-inventory", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setSuccess(`✓ Seeded successfully! Created ${data.results?.inventoryCreated || 0} items, ${data.results?.categoriesCreated || 0} categories, ${data.results?.lookupsCreated || 0} lookups.`);
        fetchInventory();
        fetchCategories();
        fetchLookupOptions();
      } else {
        setError(data.error || "Failed to seed inventory");
      }
    } catch (err) {
      console.error("Seed error:", err);
      setError("Error seeding inventory: " + err.message);
    } finally {
      setSeeding(false);
    }
  };

  const categoryColors = {
    "Medication": "bg-red-100 text-red-800",
    "Equipment": "bg-blue-100 text-blue-800",
    "Medical Supplies": "bg-green-100 text-green-800",
    "Feed": "bg-yellow-100 text-yellow-800"
  };

  const filteredInventory = inventory.filter(item => {
    const categoryValue = item.categoryName || item.category;
    return (
      (searchTerm === "" || item.item?.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (filterCategory === "all" || categoryValue === filterCategory)
    );
  });

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

          {/* Basic Information */}
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm">1</span>
              Basic Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Category <span className="text-red-500">*</span></label>
                <select
                  name="categoryId"
                  required
                  value={formData.categoryId}
                  onChange={(e) => {
                    const selected = categories.find((c) => c._id === e.target.value);
                    setFormData((prev) => ({
                      ...prev,
                      categoryId: e.target.value,
                      category: selected?.name || "",
                    }));
                  }}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-600 focus:outline-none"
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Item Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder={formData.category === "Medication" ? "e.g., Ivermectin 100ml" : formData.category === "Feed" ? "e.g., Groundnut Hay" : formData.category === "Equipment" ? "e.g., Goat Brush" : "e.g., Gloves"}
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Quantity <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  name="quantity"
                  required
                  min="0"
                  placeholder="e.g., 100"
                  value={formData.quantity}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Unit</label>
                <select
                  name="unit"
                  value={formData.unit}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-600 focus:outline-none"
                >
                  <option value="">Select Unit</option>
                  <option value="unit">Unit</option>
                  <option value="pieces">Pieces</option>
                  <option value="bottles">Bottles</option>
                  <option value="sachets">Sachets</option>
                  <option value="bags">Bags</option>
                  <option value="bales">Bales</option>
                  <option value="kg">Kilograms (kg)</option>
                  <option value="g">Grams (g)</option>
                  <option value="L">Litres (L)</option>
                  <option value="ml">Millilitres (ml)</option>
                  <option value="boxes">Boxes</option>
                  <option value="packs">Packs</option>
                  <option value="rolls">Rolls</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Min Stock Level</label>
                <input
                  type="number"
                  name="minStock"
                  min="0"
                  placeholder="Alert when below this"
                  value={formData.minStock}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Price per Unit</label>
                <input
                  type="number"
                  name="price"
                  min="0"
                  step="0.01"
                  placeholder="e.g., 2500.00"
                  value={formData.price}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-600 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Category-specific fields */}
          {formData.category === "Medication" && (
            <div className="mb-6 border-t pt-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-sm">2</span>
                Medication Details
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Size/Details</label>
                  <input
                    type="text"
                    name="details"
                    placeholder="e.g., 100ml, 500mg, 5L"
                    value={formData.details}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Expiration Date</label>
                  <input
                    type="date"
                    name="expiration"
                    value={formData.expiration}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Class / Category</label>
                  <select
                    value={formData.classCategory}
                    onChange={(e) => handleLookupSelectChange("classCategory", e.target.value)}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-600 focus:outline-none"
                  >
                    <option value="">Select Class</option>
                    {lookupOptions.classCategory.map((opt) => (
                      <option key={opt._id} value={opt.value}>{opt.value}</option>
                    ))}
                    <option value="__add_new__">+ Add new...</option>
                  </select>
                  {showLookupInput.classCategory && (
                    <div className="mt-2 flex items-center gap-2">
                      <input
                        type="text"
                        value={newLookupValue.classCategory}
                        onChange={(e) => setNewLookupValue((prev) => ({ ...prev, classCategory: e.target.value }))}
                        className="flex-1 px-3 py-2 border-2 border-gray-200 rounded-lg text-sm"
                        placeholder="Enter new class"
                      />
                      <button type="button" onClick={() => handleSaveLookup("classCategory")} className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold">Save</button>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Administration Route</label>
                  <select
                    value={formData.route}
                    onChange={(e) => handleLookupSelectChange("route", e.target.value)}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-600 focus:outline-none"
                  >
                    <option value="">Select Route</option>
                    {lookupOptions.route.map((opt) => (
                      <option key={opt._id} value={opt.value}>{opt.value}</option>
                    ))}
                    <option value="__add_new__">+ Add new...</option>
                  </select>
                  {showLookupInput.route && (
                    <div className="mt-2 flex items-center gap-2">
                      <input
                        type="text"
                        value={newLookupValue.route}
                        onChange={(e) => setNewLookupValue((prev) => ({ ...prev, route: e.target.value }))}
                        className="flex-1 px-3 py-2 border-2 border-gray-200 rounded-lg text-sm"
                        placeholder="Enter route"
                      />
                      <button type="button" onClick={() => handleSaveLookup("route")} className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold">Save</button>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Purpose</label>
                  <select
                    value={formData.purpose}
                    onChange={(e) => handleLookupSelectChange("purpose", e.target.value)}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-600 focus:outline-none"
                  >
                    <option value="">Select Purpose</option>
                    {lookupOptions.purpose.map((opt) => (
                      <option key={opt._id} value={opt.value}>{opt.value}</option>
                    ))}
                    <option value="__add_new__">+ Add new...</option>
                  </select>
                  {showLookupInput.purpose && (
                    <div className="mt-2 flex items-center gap-2">
                      <input
                        type="text"
                        value={newLookupValue.purpose}
                        onChange={(e) => setNewLookupValue((prev) => ({ ...prev, purpose: e.target.value }))}
                        className="flex-1 px-3 py-2 border-2 border-gray-200 rounded-lg text-sm"
                        placeholder="Enter purpose"
                      />
                      <button type="button" onClick={() => handleSaveLookup("purpose")} className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold">Save</button>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Recommended Dosage</label>
                  <select
                    value={formData.recommendedDosage}
                    onChange={(e) => handleLookupSelectChange("recommendedDosage", e.target.value)}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-600 focus:outline-none"
                  >
                    <option value="">Select Dosage</option>
                    {lookupOptions.recommendedDosage.map((opt) => (
                      <option key={opt._id} value={opt.value}>{opt.value}</option>
                    ))}
                    <option value="__add_new__">+ Add new...</option>
                  </select>
                  {showLookupInput.recommendedDosage && (
                    <div className="mt-2 flex items-center gap-2">
                      <input
                        type="text"
                        value={newLookupValue.recommendedDosage}
                        onChange={(e) => setNewLookupValue((prev) => ({ ...prev, recommendedDosage: e.target.value }))}
                        className="flex-1 px-3 py-2 border-2 border-gray-200 rounded-lg text-sm"
                        placeholder="Enter dosage"
                      />
                      <button type="button" onClick={() => handleSaveLookup("recommendedDosage")} className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold">Save</button>
                    </div>
                  )}
                </div>
                <div className="md:col-span-2 lg:col-span-3">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Supplier / Manufacturer</label>
                  <select
                    value={formData.supplier}
                    onChange={(e) => handleLookupSelectChange("supplier", e.target.value)}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-600 focus:outline-none"
                  >
                    <option value="">Select Supplier</option>
                    {lookupOptions.supplier.map((opt) => (
                      <option key={opt._id} value={opt.value}>{opt.value}</option>
                    ))}
                    <option value="__add_new__">+ Add new...</option>
                  </select>
                  {showLookupInput.supplier && (
                    <div className="mt-2 flex items-center gap-2">
                      <input
                        type="text"
                        value={newLookupValue.supplier}
                        onChange={(e) => setNewLookupValue((prev) => ({ ...prev, supplier: e.target.value }))}
                        className="flex-1 px-3 py-2 border-2 border-gray-200 rounded-lg text-sm"
                        placeholder="Enter supplier/manufacturer"
                      />
                      <button type="button" onClick={() => handleSaveLookup("supplier")} className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold">Save</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {formData.category === "Feed" && (
            <div className="mb-6 border-t pt-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center text-sm">2</span>
                Feed Details
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Expiration Date</label>
                  <input
                    type="date"
                    name="expiration"
                    value={formData.expiration}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Feed Type</label>
                  <select
                    name="details"
                    value={formData.details}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-600 focus:outline-none"
                  >
                    <option value="">Select Type</option>
                    <option value="Hay">Hay</option>
                    <option value="Pellets">Pellets</option>
                    <option value="Concentrate">Concentrate</option>
                    <option value="Grain">Grain</option>
                    <option value="Silage">Silage</option>
                    <option value="Supplement">Supplement</option>
                    <option value="Mineral Block">Mineral Block</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Supplier</label>
                  <select
                    value={formData.supplier}
                    onChange={(e) => handleLookupSelectChange("supplier", e.target.value)}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-600 focus:outline-none"
                  >
                    <option value="">Select Supplier</option>
                    {lookupOptions.supplier.map((opt) => (
                      <option key={opt._id} value={opt.value}>{opt.value}</option>
                    ))}
                    <option value="__add_new__">+ Add new...</option>
                  </select>
                  {showLookupInput.supplier && (
                    <div className="mt-2 flex items-center gap-2">
                      <input
                        type="text"
                        value={newLookupValue.supplier}
                        onChange={(e) => setNewLookupValue((prev) => ({ ...prev, supplier: e.target.value }))}
                        className="flex-1 px-3 py-2 border-2 border-gray-200 rounded-lg text-sm"
                        placeholder="Enter supplier"
                      />
                      <button type="button" onClick={() => handleSaveLookup("supplier")} className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold">Save</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {formData.category === "Equipment" && (
            <div className="mb-6 border-t pt-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm">2</span>
                Equipment Details
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Condition</label>
                  <select
                    name="details"
                    value={formData.details}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-600 focus:outline-none"
                  >
                    <option value="">Select Condition</option>
                    <option value="New">New</option>
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                    <option value="Needs Repair">Needs Repair</option>
                    <option value="Damaged">Damaged</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Equipment Type</label>
                  <select
                    name="classCategory"
                    value={formData.classCategory}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-600 focus:outline-none"
                  >
                    <option value="">Select Type</option>
                    <option value="Grooming">Grooming</option>
                    <option value="Feeding">Feeding</option>
                    <option value="Housing">Housing</option>
                    <option value="Handling">Handling</option>
                    <option value="Medical">Medical</option>
                    <option value="Cleaning">Cleaning</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Purchase Date</label>
                  <input
                    type="date"
                    name="expiration"
                    value={formData.expiration}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-600 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {formData.category === "Medical Supplies" && (
            <div className="mb-6 border-t pt-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm">2</span>
                Medical Supply Details
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Expiration Date</label>
                  <input
                    type="date"
                    name="expiration"
                    value={formData.expiration}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Supply Type</label>
                  <select
                    name="classCategory"
                    value={formData.classCategory}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-600 focus:outline-none"
                  >
                    <option value="">Select Type</option>
                    <option value="Syringe">Syringe</option>
                    <option value="Needle">Needle</option>
                    <option value="Gloves">Gloves</option>
                    <option value="Bandage">Bandage</option>
                    <option value="Cotton">Cotton</option>
                    <option value="Disinfectant">Disinfectant</option>
                    <option value="Surgical">Surgical</option>
                    <option value="Diagnostic">Diagnostic</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Size/Details</label>
                  <input
                    type="text"
                    name="details"
                    placeholder="e.g., 5ml, Large, 500g"
                    value={formData.details}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-600 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 flex gap-4">
            <button
              type="submit"
              disabled={formLoading}
              className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold disabled:opacity-60"
            >
              {formLoading ? (
                <>
                  <FaSpinner className="animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <FaPlus />
                  Add Item
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Controls */}
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => setShowImportModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold"
        >
          <FaUpload /> Bulk Import Medications
        </button>
        <a
          href="/manage/inventory-categories"
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg font-semibold border"
        >
          Manage Categories
        </a>
        {user?.role === "SuperAdmin" && (
          <button
            type="button"
            onClick={handleSeedInventory}
            disabled={seeding}
            className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-semibold disabled:opacity-50"
          >
            {seeding ? <FaSpinner className="animate-spin" /> : <FaDatabase />}
            {seeding ? "Seeding..." : "Seed Medications"}
          </button>
        )}
      </div>
      <FilterBar
        searchPlaceholder="Search by item name..."
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filterOptions={[
          { value: "all", label: "All Categories" },
          ...categories.map((cat) => ({ value: cat.name, label: cat.name })),
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
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${categoryColors[item.categoryName || item.category] || 'bg-gray-100 text-gray-800'}`}>
                        {item.categoryName || item.category}
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

      <Modal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        title="Bulk Import Medications"
        size="2xl"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Paste tab-separated rows with columns:
            Name, Details, Expiration, Class/Category, Purpose, Recommended Dosage, Route, Supplier/Manufacturer
          </p>
          <textarea
            rows={10}
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            className="w-full border-2 border-gray-200 rounded-lg p-3 text-sm"
            placeholder="Jubail Penstrep 100ml\t\t02/2029\tAntibiotic\t\t\tIM\t"
          />
          {importError && (
            <div className="error-message">{importError}</div>
          )}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setShowImportModal(false)}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-semibold"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleImport}
              disabled={importLoading}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold disabled:opacity-60"
            >
              {importLoading ? "Importing..." : "Import"}
            </button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}

ManageInventory.layoutType = "default";
ManageInventory.layoutProps = { title: "Inventory Management" };
