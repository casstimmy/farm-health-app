"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "framer-motion";
import { FaUndo, FaTrash, FaSearch, FaArchive } from "react-icons/fa";
import PageHeader from "@/components/shared/PageHeader";
import Loader from "@/components/Loader";

export default function ArchivedAnimals() {
  const router = useRouter();
  const [animals, setAnimals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [restoring, setRestoring] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }
    fetchArchived();
  }, [router]);

  const fetchArchived = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch("/api/animals?archived=true", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAnimals(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Failed to fetch archived animals:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (animal) => {
    if (!confirm(`Restore "${animal.name || animal.tagId}" back to active animal list?`)) return;
    setRestoring(animal._id);
    setError(""); setSuccess("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/animals/${animal._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ restoreFromArchive: true }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to restore");
      }
      setSuccess(`${animal.name || animal.tagId} restored successfully!`);
      fetchArchived();
    } catch (err) {
      setError(err.message);
    } finally {
      setRestoring(null);
    }
  };

  const filtered = animals.filter(a =>
    (a.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (a.tagId || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (a.archivedReason || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <PageHeader
        title="Archived Animals"
        subtitle="Animals removed from active list. Restore them anytime to prevent data loss."
        gradient="from-gray-600 to-gray-800"
        icon="📦"
      />

      {/* Search */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, tag ID, or archive reason..."
              className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-100"
            />
          </div>
          <div className="text-sm text-gray-500 font-semibold whitespace-nowrap">
            {filtered.length} archived
          </div>
        </div>
      </div>

      {error && <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg font-semibold">⚠️ {error}</div>}
      {success && <div className="bg-green-50 border-l-4 border-green-500 text-green-700 px-4 py-3 rounded-lg font-semibold">✅ {success}</div>}

      {loading ? (
        <Loader message="Loading archived animals..." color="gray-600" />
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
          <div className="text-6xl mb-4">📦</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No Archived Animals</h3>
          <p className="text-gray-600">
            {searchTerm ? "No matches found." : "When you delete an animal, it moves here instead of being permanently removed."}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Animal</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Species / Breed</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Status Before</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Archived Date</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Reason</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((animal, idx) => (
                  <motion.tr
                    key={animal._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.03 }}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900">{animal.name || "—"}</div>
                      <div className="text-sm text-gray-500">{animal.tagId}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      <div>{animal.species || "—"}</div>
                      <div className="text-sm text-gray-500">{animal.breed || "—"}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        animal.status === "Dead" ? "bg-red-100 text-red-700" :
                        animal.status === "Sold" ? "bg-blue-100 text-blue-700" :
                        "bg-green-100 text-green-700"
                      }`}>
                        {animal.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-700 text-sm">
                      {animal.archivedAt ? new Date(animal.archivedAt).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-6 py-4 text-gray-600 text-sm max-w-xs truncate">
                      {animal.archivedReason || "No reason given"}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleRestore(animal)}
                        disabled={restoring === animal._id}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-bold hover:bg-green-200 disabled:opacity-50"
                      >
                        {restoring === animal._id ? (
                          <span className="animate-spin">⏳</span>
                        ) : (
                          <FaUndo className="w-3 h-3" />
                        )}
                        Restore
                      </motion.button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

ArchivedAnimals.layoutType = "default";
ArchivedAnimals.layoutProps = { title: "Archived Animals" };
