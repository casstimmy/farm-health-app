"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { FaPlus, FaTimes } from "react-icons/fa";
import PageHeader from "@/components/shared/PageHeader";
import FilterBar from "@/components/shared/FilterBar";
import Loader from "@/components/Loader";

export default function Feeding() {
  const router = useRouter();
  const [records, setRecords] = useState([]);
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
    fetchRecords();
  }, [router]);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch("/api/feeding", {
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
      (filterType === "all" || record.type === filterType)
  );

  const feedTypes = [...new Set(records.map((r) => r.type))];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <PageHeader
        title="Feeding Records"
        subtitle="Track and manage animal feeding schedules and nutrition"
        gradient="from-amber-600 to-amber-700"
        icon="🌾"
      />

      {/* Controls */}
      <FilterBar
        searchPlaceholder="Search by animal name or feed type..."
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filterOptions={[
          { value: "all", label: "All Types" },
          ...feedTypes.map((type) => ({ value: type, label: type })),
        ]}
        filterValue={filterType}
        onFilterChange={setFilterType}
        showAddButton={true}
        onAddClick={() => setShowForm(!showForm)}
        isAddActive={showForm}
      />

      {/* Records Grid */}
      {loading ? (
        <Loader message="Loading feeding records..." color="amber-600" />
      ) : filteredRecords.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-gray-100">
          <p className="text-gray-500 text-lg">No feeding records found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRecords.map((record, idx) => (
            <motion.div
              key={record._id || idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-6 hover:shadow-2xl transition-all hover:border-amber-200"
            >
              <div className="mb-4">
                <h3 className="font-bold text-lg text-gray-900">{record.type || "Feeding"}</h3>
                <p className="text-sm text-gray-600">{record.animalName || "Animal"}</p>
              </div>
              <div className="space-y-2 text-sm text-gray-600">
                <p>
                  <span className="font-semibold">Amount:</span> {record.amount || "N/A"}
                </p>
                <p>
                  <span className="font-semibold">Date:</span>{" "}
                  {new Date(record.date).toLocaleDateString()}
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

Feeding.layoutType = "default";
Feeding.layoutProps = { title: "Feeding Records" };
