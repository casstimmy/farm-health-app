import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { FaArrowLeft, FaSpinner, FaCheck } from "react-icons/fa";
import PageHeader from "@/components/shared/PageHeader";

export default function AnimalDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [animal, setAnimal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [formData, setFormData] = useState({});

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/animals/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update animal");
      }

      setSuccess("Animal updated successfully!");
      setTimeout(() => {
        router.push("/manage/animals");
      }, 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
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
                <label className="block text-sm font-bold text-gray-700 mb-2">Tag ID</label>
                <input
                  type="text"
                  name="tagId"
                  value={formData.tagId || ""}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  disabled
                />
              </div>

              {/* My Notes */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">My Notes</label>
                <input
                  type="text"
                  name="myNotes"
                  value={formData.myNotes || ""}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Animal Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name || ""}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Species */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Species</label>
                <select
                  name="species"
                  value={formData.species || ""}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                >
                  <option>Goat</option>
                  <option>Sheep</option>
                  <option>Cow</option>
                  <option>Pig</option>
                  <option>Chicken</option>
                </select>
              </div>

              {/* Breed */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Breed</label>
                <input
                  type="text"
                  name="breed"
                  value={formData.breed || ""}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Origin */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Origin</label>
                <input
                  type="text"
                  name="origin"
                  value={formData.origin || ""}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Class */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Class</label>
                <select
                  name="class"
                  value={formData.class || ""}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                >
                  <option value="">Select Class</option>
                  <option value="Stud">Stud</option>
                  <option value="Female">Female</option>
                  <option value="Kid">Kid</option>
                  <option value="Adult">Adult</option>
                </select>
              </div>

              {/* Gender */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Gender</label>
                <select
                  name="gender"
                  value={formData.gender || ""}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                >
                  <option value="Male">Male ♂️</option>
                  <option value="Female">Female ♀️</option>
                </select>
              </div>

              {/* Date of Birth */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Date of Birth</label>
                <input
                  type="date"
                  name="dob"
                  value={formData.dob ? formData.dob.split("T")[0] : ""}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Acquisition Information */}
          <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6">
            <h3 className="font-bold text-green-900 mb-4 text-lg">🛒 Acquisition Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Acquisition Type */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Acquisition Type</label>
                <select
                  name="acquisitionType"
                  value={formData.acquisitionType || ""}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
                >
                  <option value="Bred on farm">Bred on farm</option>
                  <option value="Purchased">Purchased</option>
                  <option value="Imported">Imported</option>
                  <option value="Gift">Gift</option>
                </select>
              </div>

              {/* Acquisition Date */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Acquisition Date</label>
                <input
                  type="date"
                  name="acquisitionDate"
                  value={formData.acquisitionDate ? formData.acquisitionDate.split("T")[0] : ""}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
                />
              </div>

              {/* Sire ID */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Sire ID (Father)</label>
                <input
                  type="text"
                  name="sireId"
                  value={formData.sireId || ""}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
                />
              </div>

              {/* Dam ID */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Dam ID (Mother)</label>
                <input
                  type="text"
                  name="damId"
                  value={formData.damId || ""}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
                />
              </div>
            </div>
          </div>

          {/* Location & Status */}
          <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-6">
            <h3 className="font-bold text-purple-900 mb-4 text-lg">📍 Location & Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Location */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Location</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location || ""}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Paddock */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Paddock/Shed</label>
                <input
                  type="text"
                  name="paddock"
                  value={formData.paddock || ""}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Status</label>
                <select
                  name="status"
                  value={formData.status || ""}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                >
                  <option value="Alive">Alive ✓</option>
                  <option value="Sick">Sick 🤒</option>
                  <option value="Sold">Sold 💰</option>
                  <option value="Dead">Dead ✗</option>
                </select>
              </div>
            </div>
          </div>

          {/* Weight & Recording */}
          <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-6">
            <h3 className="font-bold text-orange-900 mb-4 text-lg">⚖️ Weight & Recording</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Weight */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Weight (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  name="weight"
                  value={formData.weight || ""}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-orange-500"
                />
              </div>

              {/* Weight Date */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Weight Date</label>
                <input
                  type="date"
                  name="weightDate"
                  value={formData.weightDate ? formData.weightDate.split("T")[0] : ""}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-orange-500"
                />
              </div>

              {/* Recorded By */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Recorded By</label>
                <input
                  type="text"
                  name="recordedBy"
                  value={formData.recordedBy || ""}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-6">
            <h3 className="font-bold text-gray-900 mb-4 text-lg">📝 Additional Notes</h3>
            <textarea
              name="notes"
              value={formData.notes || ""}
              onChange={handleChange}
              rows="4"
              placeholder="Add any additional notes about this animal..."
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-gray-500"
            />
          </div>

          {/* Submit Button */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 btn-primary-lg flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {saving ? (
                <>
                  <FaSpinner className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <FaCheck />
                  Save Changes
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => router.push("/manage/animals")}
              className="flex-1 btn-secondary-lg"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}

AnimalDetail.layoutType = "default";
AnimalDetail.layoutProps = { title: "Edit Animal" };
