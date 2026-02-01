"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { FaPlus, FaTimes, FaEdit, FaArrowRight, FaCheck, FaTimes as FaTimesIcon } from "react-icons/fa";
import PageHeader from "@/components/shared/PageHeader";
import FilterBar from "@/components/shared/FilterBar";
import dynamic from "next/dynamic";

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
        const res = await fetch(`/api/treatment/${_id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(editableTreatment),
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
  // Only one showForm/setShowForm state should exist. Remove this duplicate declaration.
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [formLoading, setFormLoading] = useState(false);
  const [seedLoading, setSeedLoading] = useState(false);
  const [seedMessage, setSeedMessage] = useState("");
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

  // Seed sample data (animals + treatments)
  const handleSeedData = async () => {
    setSeedLoading(true);
    setSeedMessage("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/seed-all", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        setSeedMessage("Animals and treatments seeded!");
        fetchTreatments();
      } else {
        setSeedMessage("Failed to seed data.");
      }
    } catch (err) {
      setSeedMessage("Error seeding data.");
    } finally {
      setSeedLoading(false);
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
      const res = await fetch("/api/treatment", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setTreatments(Array.isArray(data) ? data : []);
      }
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
        treatment.animalName?.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (filterType === "all" || treatment.type === filterType)
  );

  const treatmentTypes = [...new Set(treatments.map((t) => t.type))];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <PageHeader
        title="Treatment Records"
        subtitle="Manage animal treatment records and medications"
        gradient="from-blue-600 to-blue-700"
        icon="💊"
      />


      {/* Controls + Seed Button */}
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <div className="flex-1">
          <FilterBar
            searchPlaceholder="Search by animal name or treatment type..."
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
        <button
          className="btn-primary whitespace-nowrap"
          onClick={handleSeedData}
          disabled={seedLoading}
        >
          {seedLoading ? "Seeding..." : "Seed Sample Data"}
        </button>
      </div>
      {seedMessage && <div className="text-green-600 font-semibold py-2">{seedMessage}</div>}

      {/* Treatment Form */}
      {showForm && (
        <div className="my-6">
          <TreatmentForm onSubmit={handleFormSubmit} loading={formLoading} initialData={editTreatmentData} onClose={() => { setShowForm(false); setEditTreatmentData(null); }} />
        </div>
      )}

      {/* Treatments Table */}
      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : filteredTreatments.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-gray-100">
          <p className="text-gray-500 text-lg">No treatments found</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 sticky top-0 z-10">
              <tr>
                <th className="px-3 py-3 text-left font-bold text-gray-700 sticky left-0 bg-gradient-to-r from-gray-50 to-gray-100 z-20">Edit</th>
                <th className="px-3 py-3 text-left font-bold text-gray-700 sticky left-12 bg-gradient-to-r from-gray-50 to-gray-100 z-20">Advance</th>
                <th className="px-3 py-3 text-left font-bold text-gray-700">Date</th>
                <th className="px-3 py-3 text-left font-bold text-gray-700">Animal ID</th>
                <th className="px-3 py-3 text-left font-bold text-gray-700">Routine</th>
                <th className="px-3 py-3 text-left font-bold text-gray-700">Symptoms</th>
                <th className="px-3 py-3 text-left font-bold text-gray-700">Possible Cause</th>
                <th className="px-3 py-3 text-left font-bold text-gray-700">Diagnosis</th>
                <th className="px-3 py-3 text-left font-bold text-gray-700">Prescribed Days</th>
                <th className="px-3 py-3 text-left font-bold text-gray-700">Type of Treatment</th>
                <th className="px-3 py-3 text-left font-bold text-gray-700">Pre-Treatment Weight</th>
                <th className="px-3 py-3 text-left font-bold text-gray-700">Treatment/Medication</th>
                <th className="px-3 py-3 text-left font-bold text-gray-700">Dosage</th>
                <th className="px-3 py-3 text-left font-bold text-gray-700">Route</th>
                <th className="px-3 py-3 text-left font-bold text-gray-700">Treated by</th>
                <th className="px-3 py-3 text-left font-bold text-gray-700">Post Treatment Observation</th>
                <th className="px-3 py-3 text-left font-bold text-gray-700">Observation Time</th>
                <th className="px-3 py-3 text-left font-bold text-gray-700">Treatment Completion Date</th>
                <th className="px-3 py-3 text-left font-bold text-gray-700">Recovery Status</th>
                <th className="px-3 py-3 text-left font-bold text-gray-700">Post-Treatment Weight</th>
                <th className="px-3 py-3 text-left font-bold text-gray-700">Notes / Plan</th>
                <th className="px-3 py-3 text-left font-bold text-gray-700">Delete</th>
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
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.03 }}
                    className={`transition-colors ${rowBg} ${isEditing ? "bg-yellow-100" : "hover:bg-blue-50"}`}
                  >
                    {/* Inline Edit Button */}
                    <td className="px-2 py-2">
                      {isEditing ? (
                        <>
                          <button className="text-green-600 mr-1" onClick={() => handleSaveEdit(treatment._id)} title="Save"><FaCheck /></button>
                          <button className="text-gray-500" onClick={handleCancelEdit} title="Cancel"><FaTimesIcon /></button>
                        </>
                      ) : (
                        <button className="text-blue-600" onClick={() => handleEditClick(idx, treatment)} title="Edit"><FaEdit /></button>
                      )}
                    </td>
                    {/* Delete Button */}
                    <td className="px-2 py-2">
                      <button className="text-red-600" onClick={() => handleDeleteTreatment(treatment._id)} title="Delete"><FaTimes /></button>
                    </td>

                    {/* Advance Button (edit treatment) */}
                    <td className="px-2 py-2">
                      <button className="text-purple-600" onClick={() => handleAdvance(treatment)} title="Edit Treatment"><FaArrowRight /></button>
                    </td>
                    {/* Date */}
                    <td className="px-2 py-2">{isEditing ? <input type="date" name="date" value={editableTreatment.date ? editableTreatment.date.slice(0,10) : ""} onChange={handleEditChange} className="input input-xs" /> : (treatment.date ? new Date(treatment.date).toLocaleDateString() : "")}</td>
                    {/* Animal ID only */}
                    <td className="px-2 py-2">{animal.tagId || ""}</td>
                    {/* Routine */}
                    <td className="px-2 py-2">{isEditing ? <input name="routine" value={editableTreatment.routine || ""} onChange={handleEditChange} className="input input-xs" /> : (treatment.routine || "")}</td>
                    {/* Symptoms */}
                    <td className="px-2 py-2">{isEditing ? <input name="symptoms" value={editableTreatment.symptoms || ""} onChange={handleEditChange} className="input input-xs" /> : (treatment.symptoms || "")}</td>
                    {/* Possible Cause */}
                    <td className="px-2 py-2">{isEditing ? <input name="possibleCause" value={editableTreatment.possibleCause || ""} onChange={handleEditChange} className="input input-xs" /> : (treatment.possibleCause || "")}</td>
                    {/* Diagnosis */}
                    <td className="px-2 py-2">{isEditing ? <input name="diagnosis" value={editableTreatment.diagnosis || ""} onChange={handleEditChange} className="input input-xs" /> : (treatment.diagnosis || "")}</td>
                    {/* Prescribed Days */}
                    <td className="px-2 py-2">{isEditing ? <input name="prescribedDays" value={editableTreatment.prescribedDays || ""} onChange={handleEditChange} className="input input-xs" /> : (treatment.prescribedDays || "")}</td>
                    {/* Type of Treatment */}
                    <td className="px-2 py-2">{isEditing ? <input name="type" value={editableTreatment.type || ""} onChange={handleEditChange} className="input input-xs" /> : (treatment.type || "")}</td>
                    {/* Pre-Treatment Weight */}
                    <td className="px-2 py-2">{isEditing ? <input name="preWeight" value={editableTreatment.preWeight || ""} onChange={handleEditChange} className="input input-xs" /> : (treatment.preWeight || "")}</td>
                    {/* Treatment/Medication */}
                    <td className="px-2 py-2">{isEditing ? <input name="medication" value={editableTreatment.medication || ""} onChange={handleEditChange} className="input input-xs" /> : (treatment.medication || "")}</td>
                    {/* Dosage */}
                    <td className="px-2 py-2">{isEditing ? <input name="dosage" value={editableTreatment.dosage || ""} onChange={handleEditChange} className="input input-xs" /> : (treatment.dosage || "")}</td>
                    {/* Route */}
                    <td className="px-2 py-2">{isEditing ? <input name="route" value={editableTreatment.route || ""} onChange={handleEditChange} className="input input-xs" /> : (treatment.route || "")}</td>
                    {/* Treated by */}
                    <td className="px-2 py-2">{isEditing ? <input name="treatedBy" value={editableTreatment.treatedBy || ""} onChange={handleEditChange} className="input input-xs" /> : (treatment.treatedBy || "")}</td>
                    {/* Post Treatment Observation */}
                    <td className="px-2 py-2">{isEditing ? <input name="postObservation" value={editableTreatment.postObservation || ""} onChange={handleEditChange} className="input input-xs" /> : (treatment.postObservation || "")}</td>
                    {/* Observation Time */}
                    <td className="px-2 py-2">{isEditing ? <input name="observationTime" value={editableTreatment.observationTime || ""} onChange={handleEditChange} className="input input-xs" /> : (treatment.observationTime || "")}</td>
                    {/* Treatment Completion Date */}
                    <td className="px-2 py-2">{isEditing ? <input type="date" name="completionDate" value={editableTreatment.completionDate ? editableTreatment.completionDate.slice(0,10) : ""} onChange={handleEditChange} className="input input-xs" /> : (treatment.completionDate ? new Date(treatment.completionDate).toLocaleDateString() : "")}</td>
                    {/* Recovery Status */}
                    <td className="px-2 py-2">{isEditing ? <input name="recoveryStatus" value={editableTreatment.recoveryStatus || ""} onChange={handleEditChange} className="input input-xs" /> : (treatment.recoveryStatus || "")}</td>
                    {/* Post-Treatment Weight */}
                    <td className="px-2 py-2">{isEditing ? <input name="postWeight" value={editableTreatment.postWeight || ""} onChange={handleEditChange} className="input input-xs" /> : (treatment.postWeight || "")}</td>
                    {/* Notes / Plan */}
                    <td className="px-2 py-2">{isEditing ? <input name="notes" value={editableTreatment.notes || ""} onChange={handleEditChange} className="input input-xs" /> : (treatment.notes || "")}</td>
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

Treatments.layoutType = "default";
Treatments.layoutProps = { title: "Treatments" };
