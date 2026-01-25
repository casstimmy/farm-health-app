"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { FaPlus, FaTimes } from "react-icons/fa";
import PageHeader from "@/components/shared/PageHeader";
import FilterBar from "@/components/shared/FilterBar";

export default function HealthRecords() {
  const router = useRouter();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

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
      const res = await fetch("/api/treatment", {
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
      (searchTerm === "" ||
        record.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.animalName?.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (filterStatus === "all" || record.status === filterStatus)
  );

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <PageHeader
        title="Health Records"
        subtitle="Track and manage animal health and treatment history"
        gradient="from-teal-600 to-teal-700"
        icon="🏥"
      />

      {/* Controls */}
      <FilterBar
        searchPlaceholder="Search by animal name or treatment type..."
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filterOptions={[
          { value: "all", label: "All Status" },
          { value: "completed", label: "Completed" },
          { value: "pending", label: "Pending" },
        ]}
        filterValue={filterStatus}
        onFilterChange={setFilterStatus}
        showAddButton={true}
        onAddClick={() => setShowForm(!showForm)}
        isAddActive={showForm}
      />

      {/* Records Grid */}
      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : filteredRecords.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center border-2 border-gray-200">
          <p className="text-gray-500 text-lg">No health records found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRecords.map((record, idx) => (
            <motion.div
              key={record._id || idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-6 hover:shadow-2xl transition-all hover:border-green-200"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-bold text-lg text-gray-900">{record.type || "Unknown"}</h3>
                  <p className="text-sm text-gray-600">{record.animalName || "Animal"}</p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    record.status === "completed"
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {record.status || "Pending"}
                </span>
              </div>
              <div className="space-y-2 text-sm text-gray-600">
                <p>
                  <span className="font-semibold">Date:</span>{" "}
                  {new Date(record.createdAt).toLocaleDateString()}
                </p>
                <p>
                  <span className="font-semibold">Notes:</span> {record.notes || "N/A"}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

HealthRecords.layoutType = "default";
HealthRecords.layoutProps = { title: "Health Records" };
