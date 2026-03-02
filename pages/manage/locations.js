"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "framer-motion";
import { FaPlus, FaTimes, FaSpinner, FaPen, FaTrash, FaChevronDown, FaChevronUp } from "react-icons/fa";
import PageHeader from "@/components/shared/PageHeader";
import Loader from "@/components/Loader";
import { useRole } from "@/hooks/useRole";

const PADDOCK_TYPES = ["Paddock", "Shed", "Barn", "Pen", "Coop", "Stable", "Other"];
const emptyPaddock = { name: "", type: "Paddock", capacity: 0, description: "" };
const emptyLocation = { name: "", description: "", address: "", city: "", state: "" };

export default function ManageLocations() {
  const router = useRouter();
  const { user, isLoading: roleLoading } = useRole();
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [formData, setFormData] = useState({ ...emptyLocation });

  // Per-card editing state
  const [editingLocationId, setEditingLocationId] = useState(null);
  const [editLocationData, setEditLocationData] = useState({ ...emptyLocation });
  const [savingLocation, setSavingLocation] = useState(null);

  // Paddock management state
  const [expandedLocation, setExpandedLocation] = useState(null);
  const [addingPaddockTo, setAddingPaddockTo] = useState(null);
  const [paddockForm, setPaddockForm] = useState({ ...emptyPaddock });
  const [editingPaddock, setEditingPaddock] = useState(null);
  const [paddockLoading, setPaddockLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }
    if (user && !["SuperAdmin", "Manager"].includes(user.role)) { router.push("/"); return; }
    fetchLocations();
  }, [router, user]);

  const fetchLocations = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch("/api/locations", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setLocations(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching locations:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearMessages = () => { setError(""); setSuccess(""); };

  const handleAddLocation = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) { setError("Location name is required"); return; }
    setFormLoading(true);
    clearMessages();
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/locations", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(formData),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Failed to add location"); }
      setFormData({ ...emptyLocation });
      setShowAddForm(false);
      setSuccess("Location added successfully!");
      setTimeout(() => setSuccess(""), 3000);
      fetchLocations();
    } catch (err) {
      setError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const startEditLocation = (loc) => {
    setEditingLocationId(loc._id);
    setEditLocationData({
      name: loc.name || "",
      description: loc.description || "",
      address: loc.address || "",
      city: loc.city || "",
      state: loc.state || "",
    });
  };

  const cancelEditLocation = () => {
    setEditingLocationId(null);
    setEditLocationData({ ...emptyLocation });
  };

  const saveEditLocation = async (id) => {
    if (!editLocationData.name.trim()) { setError("Location name is required"); return; }
    setSavingLocation(id);
    clearMessages();
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/locations/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(editLocationData),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Failed to update location"); }
      setEditingLocationId(null);
      setSuccess("Location updated!");
      setTimeout(() => setSuccess(""), 3000);
      fetchLocations();
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingLocation(null);
    }
  };

  const handleDeleteLocation = async (id) => {
    if (!window.confirm("Are you sure you want to delete this location?")) return;
    clearMessages();
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/locations/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to delete location");
      setSuccess("Location deleted.");
      setTimeout(() => setSuccess(""), 3000);
      fetchLocations();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAddPaddock = async (locationId) => {
    if (!paddockForm.name.trim()) { setError("Paddock/Shed name is required"); return; }
    setPaddockLoading(true);
    clearMessages();
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/locations/${locationId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: "add-paddock", paddock: paddockForm }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Failed to add paddock"); }
      setPaddockForm({ ...emptyPaddock });
      setAddingPaddockTo(null);
      fetchLocations();
    } catch (err) {
      setError(err.message);
    } finally {
      setPaddockLoading(false);
    }
  };

  const handleUpdatePaddock = async (locationId, paddockId) => {
    if (!paddockForm.name.trim()) { setError("Paddock/Shed name is required"); return; }
    setPaddockLoading(true);
    clearMessages();
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/locations/${locationId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: "update-paddock", paddockId, paddock: paddockForm }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Failed to update paddock"); }
      setPaddockForm({ ...emptyPaddock });
      setEditingPaddock(null);
      fetchLocations();
    } catch (err) {
      setError(err.message);
    } finally {
      setPaddockLoading(false);
    }
  };

  const handleDeletePaddock = async (locationId, paddockId) => {
    if (!window.confirm("Delete this paddock/shed?")) return;
    clearMessages();
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/locations/${locationId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: "delete-paddock", paddockId }),
      });
      if (!res.ok) throw new Error("Failed to delete paddock");
      fetchLocations();
    } catch (err) {
      setError(err.message);
    }
  };

  const startEditPaddock = (locationId, paddock) => {
    setEditingPaddock({ locationId, paddockId: paddock._id });
    setPaddockForm({
      name: paddock.name || "",
      type: paddock.type || "Paddock",
      capacity: paddock.capacity || 0,
      description: paddock.description || "",
    });
    setAddingPaddockTo(null);
  };

  const startAddPaddock = (locationId) => {
    setAddingPaddockTo(locationId);
    setPaddockForm({ ...emptyPaddock });
    setEditingPaddock(null);
    setExpandedLocation(locationId);
  };

  const filteredLocations = locations.filter((loc) =>
    (loc.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (loc.city || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <PageHeader title="Farm Locations" subtitle="Manage farm locations and paddocks/sheds" gradient="from-green-600 to-green-700" icon={"\uD83D\uDCCD"} />

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError("")} className="text-red-500 hover:text-red-700"><FaTimes size={14} /></button>
        </div>
      )}
      {success && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm font-medium">{success}</div>
      )}

      <div className="flex flex-col md:flex-row md:items-center gap-3">
        <input type="text" placeholder="Search by location name or city..." value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-400" />
        <button onClick={() => { setShowAddForm(!showAddForm); clearMessages(); }}
          className={"px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors " +
            (showAddForm ? "bg-gray-200 text-gray-700" : "bg-green-600 text-white hover:bg-green-700")}>
          {showAddForm ? <><FaTimes size={12} /> Cancel</> : <><FaPlus size={12} /> New Location</>}
        </button>
      </div>

      <AnimatePresence>
        {showAddForm && (
          <motion.form initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            onSubmit={handleAddLocation} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-green-600 to-green-700 px-5 py-3">
              <h3 className="text-white font-bold text-sm flex items-center gap-2"><FaPlus size={12} /> Add New Location</h3>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="label">Location Name *</label>
                <input type="text" required placeholder="e.g., Main Farm" value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea placeholder="Describe this location..." value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={2} className="input-field" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="label">Address</label>
                  <input type="text" placeholder="Street address" value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="label">City</label>
                  <input type="text" placeholder="City" value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="label">State/Region</label>
                  <input type="text" placeholder="State" value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })} className="input-field" />
                </div>
              </div>
              <div className="flex justify-end">
                <button type="submit" disabled={formLoading}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold text-sm flex items-center gap-2">
                  {formLoading ? <><FaSpinner className="animate-spin" /> Adding...</> : "Add Location"}
                </button>
              </div>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {loading && (
        <div className="bg-white rounded-xl border border-gray-200 p-10">
          <Loader message="Loading locations..." color="green-600" />
        </div>
      )}

      {!loading && (
        <div className="space-y-4">
          {filteredLocations.length === 0 ? (
            <div className="bg-white rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
              <div className="text-4xl mb-2">{"\uD83D\uDCCD"}</div>
              <p className="text-gray-700 font-semibold mb-1">No locations found</p>
              <p className="text-gray-500 text-sm">Create your first location to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredLocations.map((location, idx) => {
                const isEditing = editingLocationId === location._id;
                const isExpanded = expandedLocation === location._id;
                const paddocks = location.paddocks || [];
                const isSaving = savingLocation === location._id;
                return (
                  <motion.div key={location._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden">
                    {isEditing ? (
                      <div className="p-4 space-y-3 bg-green-50 border-b border-green-200">
                        <input className="input-field" placeholder="Location Name *" value={editLocationData.name}
                          onChange={(e) => setEditLocationData({ ...editLocationData, name: e.target.value })} />
                        <textarea className="input-field" placeholder="Description" rows={2} value={editLocationData.description}
                          onChange={(e) => setEditLocationData({ ...editLocationData, description: e.target.value })} />
                        <div className="grid grid-cols-3 gap-2">
                          <input className="input-field" placeholder="Address" value={editLocationData.address}
                            onChange={(e) => setEditLocationData({ ...editLocationData, address: e.target.value })} />
                          <input className="input-field" placeholder="City" value={editLocationData.city}
                            onChange={(e) => setEditLocationData({ ...editLocationData, city: e.target.value })} />
                          <input className="input-field" placeholder="State" value={editLocationData.state}
                            onChange={(e) => setEditLocationData({ ...editLocationData, state: e.target.value })} />
                        </div>
                        <div className="flex gap-2 justify-end">
                          <button onClick={cancelEditLocation} className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-semibold hover:bg-gray-50">Cancel</button>
                          <button onClick={() => saveEditLocation(location._id)} disabled={isSaving}
                            className="px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1">
                            {isSaving ? <><FaSpinner className="animate-spin" size={10} /> Saving...</> : "Save"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{"\uD83D\uDCCD"}</span>
                            <h3 className="text-lg font-bold text-green-900">{location.name}</h3>
                          </div>
                          <div className="flex items-center gap-1">
                            <button onClick={() => startEditLocation(location)} title="Edit"
                              className="p-1.5 rounded-lg border border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100">
                              <FaPen size={10} />
                            </button>
                            <button onClick={() => handleDeleteLocation(location._id)} title="Delete"
                              className="p-1.5 rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100">
                              <FaTrash size={10} />
                            </button>
                          </div>
                        </div>
                        {location.description && <p className="text-sm text-gray-600 mb-2">{location.description}</p>}
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                          {location.address && <span>{"\uD83D\uDCEC"} {location.address}</span>}
                          {location.city && <span>{"\uD83C\uDFD9\uFE0F"} {location.city}</span>}
                          {location.state && <span>{"\uD83D\uDDFA\uFE0F"} {location.state}</span>}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-t border-gray-100 cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => setExpandedLocation(isExpanded ? null : location._id)}>
                      <span className="text-xs font-bold text-gray-700">Paddocks / Sheds ({paddocks.length})</span>
                      <span className="text-gray-400">{isExpanded ? <FaChevronUp size={10} /> : <FaChevronDown size={10} />}</span>
                    </div>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                          <div className="p-4 space-y-3 border-t border-gray-100">
                            {paddocks.length === 0 && addingPaddockTo !== location._id && (
                              <p className="text-xs text-gray-400 text-center py-2">No paddocks/sheds yet</p>
                            )}
                            {paddocks.map((p) => {
                              const isEditingThis = editingPaddock?.paddockId === p._id && editingPaddock?.locationId === location._id;
                              return isEditingThis ? (
                                <div key={p._id} className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 space-y-2">
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                    <input className="input-field text-xs" placeholder="Name *" value={paddockForm.name}
                                      onChange={(e) => setPaddockForm({ ...paddockForm, name: e.target.value })} />
                                    <select className="input-field text-xs" value={paddockForm.type}
                                      onChange={(e) => setPaddockForm({ ...paddockForm, type: e.target.value })}>
                                      {PADDOCK_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                    <input className="input-field text-xs" type="number" min="0" placeholder="Capacity" value={paddockForm.capacity}
                                      onChange={(e) => setPaddockForm({ ...paddockForm, capacity: Number(e.target.value) })} />
                                    <input className="input-field text-xs" placeholder="Notes" value={paddockForm.description}
                                      onChange={(e) => setPaddockForm({ ...paddockForm, description: e.target.value })} />
                                  </div>
                                  <div className="flex gap-2 justify-end">
                                    <button onClick={() => { setEditingPaddock(null); setPaddockForm({ ...emptyPaddock }); }}
                                      className="px-3 py-1 border border-gray-300 rounded text-xs hover:bg-gray-50">Cancel</button>
                                    <button onClick={() => handleUpdatePaddock(location._id, p._id)} disabled={paddockLoading}
                                      className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 flex items-center gap-1">
                                      {paddockLoading ? <FaSpinner className="animate-spin" size={10} /> : null} Save
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div key={p._id} className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                                  <div className="flex items-center gap-3">
                                    <span className="text-sm">{p.type === "Shed" ? "\uD83C\uDFDA\uFE0F" : p.type === "Barn" ? "\uD83C\uDFD7\uFE0F" : p.type === "Coop" ? "\uD83D\uDC14" : p.type === "Stable" ? "\uD83D\uDC34" : "\uD83C\uDF3F"}</span>
                                    <div>
                                      <p className="text-sm font-semibold text-gray-800">{p.name}</p>
                                      <p className="text-xs text-gray-500">
                                        {p.type} {p.capacity ? `\u00B7 Capacity: ${p.capacity}` : ""}
                                        {p.description ? ` \u00B7 ${p.description}` : ""}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex gap-1">
                                    <button onClick={() => startEditPaddock(location._id, p)}
                                      className="p-1 rounded border border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100">
                                      <FaPen size={9} />
                                    </button>
                                    <button onClick={() => handleDeletePaddock(location._id, p._id)}
                                      className="p-1 rounded border border-red-200 bg-red-50 text-red-600 hover:bg-red-100">
                                      <FaTrash size={9} />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}

                            {addingPaddockTo === location._id && (
                              <div className="bg-green-50 border border-green-200 rounded-lg p-3 space-y-2">
                                <p className="text-xs font-bold text-green-800">Add Paddock/Shed</p>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                  <input className="input-field text-xs" placeholder="Name *" value={paddockForm.name}
                                    onChange={(e) => setPaddockForm({ ...paddockForm, name: e.target.value })} />
                                  <select className="input-field text-xs" value={paddockForm.type}
                                    onChange={(e) => setPaddockForm({ ...paddockForm, type: e.target.value })}>
                                    {PADDOCK_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                                  </select>
                                  <input className="input-field text-xs" type="number" min="0" placeholder="Capacity" value={paddockForm.capacity}
                                    onChange={(e) => setPaddockForm({ ...paddockForm, capacity: Number(e.target.value) })} />
                                  <input className="input-field text-xs" placeholder="Notes" value={paddockForm.description}
                                    onChange={(e) => setPaddockForm({ ...paddockForm, description: e.target.value })} />
                                </div>
                                <div className="flex gap-2 justify-end">
                                  <button onClick={() => { setAddingPaddockTo(null); setPaddockForm({ ...emptyPaddock }); }}
                                    className="px-3 py-1 border border-gray-300 rounded text-xs hover:bg-gray-50">Cancel</button>
                                  <button onClick={() => handleAddPaddock(location._id)} disabled={paddockLoading}
                                    className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 flex items-center gap-1">
                                    {paddockLoading ? <FaSpinner className="animate-spin" size={10} /> : null} Add
                                  </button>
                                </div>
                              </div>
                            )}

                            {addingPaddockTo !== location._id && (
                              <button onClick={() => startAddPaddock(location._id)}
                                className="w-full py-1.5 border border-dashed border-green-400 rounded-lg text-xs font-semibold text-green-700 hover:bg-green-50 flex items-center justify-center gap-1">
                                <FaPlus size={9} /> Add Paddock/Shed
                              </button>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

ManageLocations.layoutType = "default";
ManageLocations.layoutProps = { title: "Manage Locations" };
