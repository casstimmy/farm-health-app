import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { FaArrowLeft, FaSpinner } from "react-icons/fa";
import PageHeader from "@/components/shared/PageHeader";
import AddAnimalForm from "@/components/animals/AddAnimalForm";

export default function AnimalDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [animal, setAnimal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    fetchAnimal();
  }, [id]);

  const fetchAnimal = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/animals/${id}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      setAnimal(data);
      setFormData(data);
    } catch (error) {
      setError("Failed to load animal details");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-8"
      if (loading) {
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-8"
          >
            <PageHeader
              title="Loading..."
              subtitle="Fetching animal details"
              gradient="from-blue-600 to-blue-700"
              icon="🐑"
            />
            <div className="flex justify-center items-center py-16">
              <FaSpinner className="animate-spin text-green-600" size={40} />
            </div>
          </motion.div>
        );
      }

      if (!animal) {
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-8"
          >
            <PageHeader
              title="Animal Not Found"
              subtitle="The animal you're looking for doesn't exist"
              gradient="from-red-600 to-red-700"
              icon="⚠️"
            />
            <div className="text-center">
              <button
                onClick={() => router.push("/manage/animals")}
                className="btn-primary-lg"
              >
                ← Back to Animals
              </button>
            </div>
          </motion.div>
        );
      }
    >
      {/* Page Header */}
      <PageHeader
        title={`Edit ${animal.name || animal.tagId}`}
        subtitle="Advanced animal record details"
        gradient="from-blue-600 to-blue-700"
        icon="🐑"
      />

      {/* Back Button */}
      <button
        onClick={() => router.push("/manage/animals")}
        className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold mb-4"
      >
        <FaArrowLeft size={16} /> Back to Animals
      </button>

      {/* Form Container */}
      <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-8">
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg">
            ⚠️ {error}
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border-l-4 border-green-500 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
            <FaCheck /> {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
            <h3 className="font-bold text-blue-900 mb-4 text-lg">📋 Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Tag ID */}
              <div>
                return (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-8"
                  >
                    <PageHeader
                      title={`Edit ${animal.name || animal.tagId}`}
                      subtitle="Advanced animal record details"
                      gradient="from-blue-600 to-blue-700"
                      icon="🐑"
                    />
                    <button
                      onClick={() => router.push("/manage/animals")}
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold mb-4"
                    >
                      <FaArrowLeft size={16} /> Back to Animals
                    </button>
                    <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-8">
                      {error && (
                        <div className="mb-6 bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg">
                          ⚠️ {error}
                        </div>
                      )}
                      <AddAnimalForm animal={animal} onSuccess={() => router.push("/manage/animals")} />
                    </div>
                  </motion.div>
                );
          </div>
