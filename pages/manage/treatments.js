"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { FaPlus, FaTimes, FaEdit, FaArrowRight, FaCheck, FaTimes as FaTimesIcon } from "react-icons/fa";
import PageHeader from "@/components/shared/PageHeader";
import FilterBar from "@/components/shared/FilterBar";
import Loader from "@/components/Loader";
import dynamic from "next/dynamic";
import { invalidateCache } from "@/utils/cache";

const TreatmentForm = dynamic(() => import("@/components/treatment/TreatmentForm"), { ssr: false });

export default function Treatments() {
    const [editIndex, setEditIndex] = useState(null);
    const [editableTreatment, setEditableTreatment] = useState({});
    // Inline edit handlers
    const handleEditClick = (idx, treatment) => {
      setEditIndex(idx);
      setEditableTreatment({ ...treatment });
    };
    const handleCancelEdit = () => {
      setEditIndex(null);
      setEditableTreatment({});
    };
    const handleEditChange = (e) => {
      const { name, value } = e.target;
      setEditableTreatment((prev) => ({ ...prev, [name]: value }));
    };
    const handleSaveEdit = async (_id) => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const selectedMedication = medicationOptions.find((m) => m._id === editableTreatment.medication);
        const payload = {
          ...editableTreatment,
          prescribedDays: editableTreatment.prescribedDays === "" ? 0 : Number(editableTreatment.prescribedDays || 0),
          preWeight: editableTreatment.preWeight === "" ? null : Number(editableTreatment.preWeight),
          postWeight: editableTreatment.postWeight === "" ? null : Number(editableTreatment.postWeight),
          medicationName: selectedMedication?.item || editableTreatment.medicationName || "",
        };
        const res = await fetch(`/api/treatment/${_id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          fetchTreatments();
          setEditIndex(null);
          setEditableTreatment({});
        }
      } catch (err) {
        // handle error
      } finally {
        setLoading(false);
      }
    };
    const handleDeleteTreatment = async (_id) => {
      if (!confirm("Are you sure you want to delete this treatment record?")) return;
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const res = await fetch(`/api/treatment/${_id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (res.ok) {
          fetchTreatments();
        }
      } catch (err) {
        console.error("Failed to delete treatment:", err);
      } finally {
        setLoading(false);
      }
    };
    // Advance button opens the treatment form for editing this treatment
    const [showForm, setShowForm] = useState(false);
    const [editTreatmentData, setEditTreatmentData] = useState(null);
    const handleAdvance = (treatment) => {
      setEditTreatmentData(treatment);
      setShowForm(true);
    };
  const router = useRouter();
  const [treatments, setTreatments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [formLoading, setFormLoading] = useState(false);
  const [medicationOptions, setMedicationOptions] = useState([]);
  const [staffOptions, setStaffOptions] = useState([]);
  // Handle treatment form submit (create or update)
  const handleFormSubmit = async (form) => {
    setFormLoading(true);
    try {
      const token = localStorage.getItem("token");
      const { _id, __v, createdAt, updatedAt, ...cleanForm } = form;
      let res;
      if (_id) {
        // Update existing treatment
        res = await fetch(`/api/treatment/${_id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(cleanForm),
        });
      } else {
        // Create new treatment
        res = await fetch("/api/treatment", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(cleanForm),
        });
      }
      if (res.ok) {
        fetchTreatments();
        setShowForm(false);
        setEditTreatmentData(null);
      }
    } catch (err) {
      // handle error
    } finally {
      setFormLoading(false);
    }
  };



  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    fetchTreatments();
  }, [router]);

  const fetchTreatments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      const [treatmentsRes, inventoryRes, usersRes] = await Promise.all([
        fetch("/api/treatment", { headers }),
        fetch("/api/inventory", { headers }),
        fetch("/api/users", { headers }),
      ]);
      const data = treatmentsRes.ok ? await treatmentsRes.json() : [];
      const inventory = inventoryRes.ok ? await inventoryRes.json() : [];
      const users = usersRes.ok ? await usersRes.json() : [];
      const meds = (Array.isArray(inventory) ? inventory : []).filter(
        (item) => String(item.categoryName || item.category || "").toLowerCase() === "medication"
      );
      setTreatments(Array.isArray(data) ? data : []);
      setMedicationOptions(meds);
      setStaffOptions(Array.isArray(users) ? users : []);
    } catch (err) {
      console.error("Failed to fetch treatments:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredTreatments = treatments.filter(
    (treatment) =>
      (searchTerm === "" ||
        treatment.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        treatment.medicationName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        treatment.symptoms?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        treatment.diagnosis?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        treatment.animal?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        treatment.animal?.tagId?.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (filterType === "all" || treatment.type === filterType || treatment.recoveryStatus === filterType)
  );

  const treatmentTypes = [...new Set(treatments.map((t) => t.type || t.recoveryStatus).filter(Boolean))];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <PageHeader
        title="Treatment Records"
        subtitle="Manage animal treatment records and medications"
        gradient="from-blue-600 to-blue-700"
        icon="💊"
      />


      {/* Controls Section */}
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <div className="flex-1">
          <FilterBar
            searchPlaceholder="Search by animal, diagnosis, medication, or type..."
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            filterOptions={[
              { value: "all", label: "All Types" },
              ...treatmentTypes.map((type) => ({ value: type, label: type })),
            ]}
            filterValue={filterType}
            onFilterChange={setFilterType}
            showAddButton={true}
            onAddClick={() => setShowForm(!showForm)}
            isAddActive={showForm}
          />
        </div>
      </div>

      {/* Treatment Form Modal */}
      {showForm && (
        <div className="fixed inset-0 backdrop-blur-lg bg-gray-100 bg-opacity-10 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full my-8 relative">
            {formLoading && (
              <div className="absolute inset-0 bg-white bg-opacity-75 rounded-2xl flex items-center justify-center z-10">
                <Loader message="Saving treatment record..." color="blue-600" />
              </div>
            )}
            <div className="p-6 border-b border-gray-200 sticky top-0 bg-white rounded-t-2xl">
              <h2 className="text-2xl font-bold text-gray-800">{editTreatmentData?._id ? "Edit Treatment Record" : "New Treatment Record"}</h2>
              <p className="text-gray-600 text-sm mt-1">Fill in the treatment details below</p>
            </div>
            <div className="p-6 max-h-[calc(90vh-150px)] overflow-y-auto">
              <TreatmentForm
                key={editTreatmentData?._id || "new-treatment"}
                onSubmit={handleFormSubmit}
                loading={formLoading}
                initialData={editTreatmentData}
                medicationOptions={medicationOptions}
                staffOptions={staffOptions}
                onClose={() => { setShowForm(false); setEditTreatmentData(null); }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Treatments Table */}
      {loading ? (
        <Loader message="Loading treatments..." color="blue-600" />
      ) : filteredTreatments.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg p-16 text-center border border-gray-200">
          <div className="text-5xl mb-4">📋</div>
          <p className="text-gray-600 text-lg font-medium">No treatments found</p>
          <p className="text-gray-500 text-sm mt-2">Click the + button to add your first treatment record</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-blue-600 to-blue-700">
                <tr>
                  <th className="px-4 py-4 text-left font-semibold text-white whitespace-nowrap">Actions</th>
                  <th className="px-4 py-4 text-left font-semibold text-white whitespace-nowrap">Date</th>
                  <th className="px-4 py-4 text-left font-semibold text-white whitespace-nowrap">Animal ID</th>
                  <th className="px-4 py-4 text-left font-semibold text-white whitespace-nowrap">Routine</th>
                  <th className="px-4 py-4 text-left font-semibold text-white whitespace-nowrap">Symptoms</th>
                  <th className="px-4 py-4 text-left font-semibold text-white whitespace-nowrap">Diagnosis</th>
                  <th className="px-4 py-4 text-left font-semibold text-white whitespace-nowrap">Type</th>
                  <th className="px-4 py-4 text-left font-semibold text-white whitespace-nowrap">Medication</th>
                  <th className="px-4 py-4 text-left font-semibold text-white whitespace-nowrap">Dosage</th>
                  <th className="px-4 py-4 text-left font-semibold text-white whitespace-nowrap">Route</th>
                  <th className="px-4 py-4 text-left font-semibold text-white whitespace-nowrap">Treated By</th>
                  <th className="px-4 py-4 text-left font-semibold text-white whitespace-nowrap">Pre-Weight</th>
                  <th className="px-4 py-4 text-left font-semibold text-white whitespace-nowrap">Post-Weight</th>
                  <th className="px-4 py-4 text-left font-semibold text-white whitespace-nowrap">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredTreatments.map((treatment, idx) => {
                  const animal = treatment.animal || {};
                  const isEditing = editIndex === idx;
                  const rowBg = idx % 2 === 0 ? "bg-white" : "bg-gray-50";
                  return (
                    <motion.tr
                      key={treatment._id || idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className={`transition-all duration-200 ${rowBg} ${isEditing ? "bg-amber-50" : "hover:bg-blue-50"}`}
                    >
                      {/* Action Buttons */}
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          {isEditing ? (
                            <>
                              <button 
                                className="text-green-600 hover:text-green-800 hover:bg-green-100 p-1 rounded transition" 
                                onClick={() => handleSaveEdit(treatment._id)} 
                                title="Save"
                              >
                                <FaCheck size={16} />
                              </button>
                              <button 
                                className="text-gray-500 hover:text-gray-700 hover:bg-gray-200 p-1 rounded transition" 
                                onClick={handleCancelEdit} 
                                title="Cancel"
                              >
                                <FaTimesIcon size={16} />
                              </button>
                            </>
                          ) : (
                            <>
                              <button 
                                className="text-blue-600 hover:text-blue-800 hover:bg-blue-100 p-1 rounded transition" 
                                onClick={() => handleEditClick(idx, treatment)} 
                                title="Quick Edit"
                              >
                                <FaEdit size={16} />
                              </button>
                              <button 
                                className="text-purple-600 hover:text-purple-800 hover:bg-purple-100 p-1 rounded transition" 
                                onClick={() => handleAdvance(treatment)} 
                                title="Full Edit"
                              >
                                <FaArrowRight size={16} />
                              </button>
                              <button 
                                className="text-red-600 hover:text-red-800 hover:bg-red-100 p-1 rounded transition" 
                                onClick={() => handleDeleteTreatment(treatment._id)} 
                                title="Delete"
                              >
                                <FaTimes size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                      {/* Date */}
                      <td className="px-4 py-3 text-gray-700">{isEditing ? <input type="date" name="date" value={editableTreatment.date ? editableTreatment.date.slice(0,10) : ""} onChange={handleEditChange} className="input input-sm w-32" /> : (treatment.date ? new Date(treatment.date).toLocaleDateString() : "-")}</td>
                      {/* Animal ID */}
                      <td className="px-4 py-3 font-medium text-gray-900">{animal.tagId || "-"}</td>
                      {/* Routine */}
                      <td className="px-4 py-3 text-gray-700">{isEditing ? <select name="routine" value={editableTreatment.routine || ""} onChange={handleEditChange} className="input input-sm"><option value="">-</option><option value="NO">NO</option><option value="YES">YES</option></select> : (treatment.routine || "-")}</td>
                      {/* Symptoms */}
                      <td className="px-4 py-3 text-gray-700">{isEditing ? <input name="symptoms" value={editableTreatment.symptoms || ""} onChange={handleEditChange} className="input input-sm w-24" /> : (treatment.symptoms || "-")}</td>
                      {/* Diagnosis */}
                      <td className="px-4 py-3 text-gray-700">{isEditing ? <input name="diagnosis" value={editableTreatment.diagnosis || ""} onChange={handleEditChange} className="input input-sm w-24" /> : (treatment.diagnosis || "-")}</td>
                      {/* Type */}
                      <td className="px-4 py-3 text-gray-700">{isEditing ? <input name="type" value={editableTreatment.type || ""} onChange={handleEditChange} className="input input-sm w-28" /> : (treatment.type || "-")}</td>
                      {/* Medication */}
                      <td className="px-4 py-3 text-gray-700">
                        {isEditing ? (
                          <select
                            name="medication"
                            value={editableTreatment.medication || ""}
                            onChange={(e) => {
                              const selected = medicationOptions.find((m) => m._id === e.target.value);
                              setEditableTreatment((prev) => ({
                                ...prev,
                                medication: e.target.value,
                                medicationName: selected?.item || "",
                              }));
                            }}
                            className="input input-sm w-40"
                          >
                            <option value="">Select medication</option>
                            {medicationOptions.map((med) => (
                              <option key={med._id} value={med._id}>{med.item}</option>
                            ))}
                          </select>
                        ) : (treatment.medicationName || "-")}
                      </td>
                      {/* Dosage */}
                      <td className="px-4 py-3 text-gray-700">{isEditing ? <input name="dosage" value={editableTreatment.dosage || ""} onChange={handleEditChange} className="input input-sm w-20" /> : (treatment.dosage || "-")}</td>
                      {/* Route */}
                      <td className="px-4 py-3 text-gray-700">{isEditing ? <input name="route" value={editableTreatment.route || ""} onChange={handleEditChange} className="input input-sm w-20" /> : (treatment.route || "-")}</td>
                      {/* Treated by */}
                      <td className="px-4 py-3 text-gray-700">
                        {isEditing ? (
                          <select
                            name="treatedBy"
                            value={editableTreatment.treatedBy || ""}
                            onChange={handleEditChange}
                            className="input input-sm w-36"
                          >
                            <option value="">Select staff</option>
                            {staffOptions.map((staff) => (
                              <option key={staff._id} value={staff.name || staff.email || staff.username}>
                                {staff.name || staff.email || staff.username}
                              </option>
                            ))}
                          </select>
                        ) : (treatment.treatedBy || "-")}
                      </td>
                      {/* Pre-Weight */}
                      <td className="px-4 py-3 text-gray-700">{isEditing ? <input name="preWeight" value={editableTreatment.preWeight || ""} onChange={handleEditChange} className="input input-sm w-20" /> : (treatment.preWeight || "-")}</td>
                      {/* Post-Weight */}
                      <td className="px-4 py-3 text-gray-700">{isEditing ? <input name="postWeight" value={editableTreatment.postWeight || ""} onChange={handleEditChange} className="input input-sm w-20" /> : (treatment.postWeight || "-")}</td>
                      {/* Status */}
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${treatment.recoveryStatus ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                          {treatment.recoveryStatus || "Pending"}
                        </span>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

Treatments.layoutType = "default";
Treatments.layoutProps = { title: "Treatments" };
