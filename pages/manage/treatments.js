"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { FaPlus, FaTimes } from "react-icons/fa";
import PageHeader from "@/components/shared/PageHeader";
import FilterBar from "@/components/shared/FilterBar";

export default function Treatments() {
  const router = useRouter();
  const [treatments, setTreatments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");

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

      {/* Controls */}
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

      {/* Treatments Table */}
      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : filteredTreatments.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-gray-100">
          <p className="text-gray-500 text-lg">No treatments found</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Animal</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Type</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Date</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredTreatments.map((treatment, idx) => (
                <motion.tr
                  key={treatment._id || idx}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  className="hover:bg-blue-50 transition-colors"
                >
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {treatment.animalName || "Unknown"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{treatment.type || "N/A"}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(treatment.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{treatment.notes || "N/A"}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

Treatments.layoutType = "default";
Treatments.layoutProps = { title: "Treatments" };
