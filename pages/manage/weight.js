"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { FaPlus, FaTimes } from "react-icons/fa";
import PageHeader from "@/components/shared/PageHeader";
import FilterBar from "@/components/shared/FilterBar";

export default function WeightTracking() {
  const router = useRouter();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    fetchRecords();
  }, [router]);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch("/api/weight", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setRecords(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Failed to fetch records:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredRecords = records.filter(
    (record) =>
      searchTerm === "" || record.animalName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <PageHeader
        title="Weight Tracking"
        subtitle="Monitor and track animal weight progression"
        gradient="from-purple-600 to-purple-700"
        icon="⚖️"
      />

      {/* Controls */}
      <FilterBar
        searchPlaceholder="Search by animal name..."
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        showAddButton={true}
        onAddClick={() => setShowForm(!showForm)}
        isAddActive={showForm}
      />

      {/* Records Table */}
      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : filteredRecords.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center border-2 border-gray-200">
          <p className="text-gray-500 text-lg">No weight records found</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-purple-50 to-purple-100">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Animal</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Weight (kg)</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Date</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredRecords.map((record, idx) => (
                <motion.tr
                  key={record._id || idx}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  className="hover:bg-purple-50 transition-colors"
                >
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {record.animalName || "Unknown"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{record.weight || "N/A"}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(record.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{record.notes || "N/A"}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

WeightTracking.layoutType = "default";
WeightTracking.layoutProps = { title: "Weight Tracking" };
