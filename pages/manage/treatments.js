"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { FaPlus, FaTimes } from "react-icons/fa";
import PageHeader from "@/components/shared/PageHeader";
import FilterBar from "@/components/shared/FilterBar";
import dynamic from "next/dynamic";

const TreatmentForm = dynamic(() => import("@/components/treatment/TreatmentForm"), { ssr: false });

export default function Treatments() {
  const router = useRouter();
  const [treatments, setTreatments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [formLoading, setFormLoading] = useState(false);
  const [seedLoading, setSeedLoading] = useState(false);
  const [seedMessage, setSeedMessage] = useState("");
  // Handle new treatment form submit
  const handleFormSubmit = async (form) => {
    setFormLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/treatment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        fetchTreatments();
        setShowForm(false);
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
          <TreatmentForm onSubmit={handleFormSubmit} loading={formLoading} />
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
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                <th className="px-2 py-2">Date</th>
                <th className="px-2 py-2">Animal ID</th>
                <th className="px-2 py-2">Breed</th>
                <th className="px-2 py-2">Gender</th>
                <th className="px-2 py-2">Routine</th>
                <th className="px-2 py-2">Symptoms</th>
                <th className="px-2 py-2">Possible Cause</th>
                <th className="px-2 py-2">Diagnosis</th>
                <th className="px-2 py-2">Prescribed Days</th>
                <th className="px-2 py-2">Type of Treatment</th>
                <th className="px-2 py-2">Pre-Treatment Weight</th>
                <th className="px-2 py-2">Treatment/Medication</th>
                <th className="px-2 py-2">Dosage</th>
                <th className="px-2 py-2">Route</th>
                <th className="px-2 py-2">Treated by</th>
                <th className="px-2 py-2">Post Treatment Observation</th>
                <th className="px-2 py-2">Observation Time</th>
                <th className="px-2 py-2">Treatment Completion Date</th>
                <th className="px-2 py-2">Recovery Status</th>
                <th className="px-2 py-2">Post-Treatment Weight</th>
                <th className="px-2 py-2">Notes / Plan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredTreatments.map((treatment, idx) => {
                const animal = treatment.animal || {};
                return (
                  <motion.tr
                    key={treatment._id || idx}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.03 }}
                    className="hover:bg-blue-50 transition-colors"
                  >
                    <td className="px-2 py-2">{treatment.date ? new Date(treatment.date).toLocaleDateString() : ""}</td>
                    <td className="px-2 py-2">{animal.tagId || ""}</td>
                    <td className="px-2 py-2">{animal.breed || ""}</td>
                    <td className="px-2 py-2">{animal.gender || ""}</td>
                    <td className="px-2 py-2">{treatment.routine || ""}</td>
                    <td className="px-2 py-2">{treatment.symptoms || ""}</td>
                    <td className="px-2 py-2">{treatment.possibleCause || ""}</td>
                    <td className="px-2 py-2">{treatment.diagnosis || ""}</td>
                    <td className="px-2 py-2">{treatment.prescribedDays || ""}</td>
                    <td className="px-2 py-2">{treatment.type || ""}</td>
                    <td className="px-2 py-2">{treatment.preWeight || ""}</td>
                    <td className="px-2 py-2">{treatment.medication || ""}</td>
                    <td className="px-2 py-2">{treatment.dosage || ""}</td>
                    <td className="px-2 py-2">{treatment.route || ""}</td>
                    <td className="px-2 py-2">{treatment.treatedBy || ""}</td>
                    <td className="px-2 py-2">{treatment.postObservation || ""}</td>
                    <td className="px-2 py-2">{treatment.observationTime || ""}</td>
                    <td className="px-2 py-2">{treatment.completionDate ? new Date(treatment.completionDate).toLocaleDateString() : ""}</td>
                    <td className="px-2 py-2">{treatment.recoveryStatus || ""}</td>
                    <td className="px-2 py-2">{treatment.postWeight || ""}</td>
                    <td className="px-2 py-2">{treatment.notes || ""}</td>
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
