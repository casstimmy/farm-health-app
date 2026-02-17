"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { FaPlus, FaTimes, FaSpinner } from "react-icons/fa";
import PageHeader from "@/components/shared/PageHeader";
import FilterBar from "@/components/shared/FilterBar";
import Modal from "@/components/shared/Modal";
import { useRole } from "@/hooks/useRole";
import Loader from "@/components/Loader";
import { getCachedData, invalidateCache } from "@/utils/cache";

export default function ManageLocations() {
  const router = useRouter();
  const { user, isLoading: roleLoading } = useRole();
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    address: "",
    city: "",
    state: "",
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    // Check if user has permission (SuperAdmin or Manager)
    if (user && !["SuperAdmin", "Manager"].includes(user.role)) {
      router.push("/");
      return;
    }

    fetchLocations();
  }, [router]);

  const fetchLocations = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const data = await getCachedData("api/locations", async () => {
        const res = await fetch("/api/locations", {
          headers: { Authorization: `Bearer ${token}` },
        });
        return await res.json();
      }, 3 * 60 * 1000);
      setLocations(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching locations:", error);
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
    setFormLoading(true);
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/locations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setSuccess("✓ Location added successfully!");
        setFormData({ name: "", description: "", address: "", city: "", state: "" });
        setTimeout(() => {
          setShowModal(false);
          fetchLocations();
        }, 1000);
      } else {
        const errorData = await res.json();
        setError(errorData.error || "Failed to add location");
      }
    } catch (error) {
      setError("Error adding location");
      console.error("Error:", error);
    } finally {
      setFormLoading(false);
    }
  };

  const filteredLocations = locations.filter((loc) =>
    loc.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    loc.city?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      {/* Page Header */}
      <PageHeader
        title="Farm Locations"
        subtitle="Manage farm locations and facilities"
        gradient="from-green-600 to-green-700"
        icon="📍"
      />

      {/* Controls */}
      <FilterBar
        searchPlaceholder="Search by location name or city..."
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        showAddButton={true}
        onAddClick={() => setShowModal(true)}
        isAddActive={showModal}
      />

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setFormData({ name: "", description: "", address: "", city: "", state: "" });
          setError("");
          setSuccess("");
        }}
        title="Add New Location"
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <div>
            <label className="label">Location Name *</label>
            <input
              type="text"
              name="name"
              required
              placeholder="e.g., Main Farm, Secondary Farm"
              value={formData.name}
              onChange={handleChange}
              className="input-field"
            />
          </div>

          <div>
            <label className="label">Description</label>
            <textarea
              name="description"
              placeholder="Describe this location..."
              value={formData.description}
              onChange={handleChange}
              rows="3"
              className="input-field"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Address</label>
              <input
                type="text"
                name="address"
                placeholder="Street address"
                value={formData.address}
                onChange={handleChange}
                className="input-field"
              />
            </div>

            <div>
              <label className="label">City</label>
              <input
                type="text"
                name="city"
                placeholder="City"
                value={formData.city}
                onChange={handleChange}
                className="input-field"
              />
            </div>
          </div>

          <div>
            <label className="label">State/Region</label>
            <input
              type="text"
              name="state"
              placeholder="State or region"
              value={formData.state}
              onChange={handleChange}
              className="input-field"
            />
          </div>

          <button
            type="submit"
            disabled={formLoading}
            className="btn-primary-lg w-full"
          >
            {formLoading ? (
              <>
                <FaSpinner className="animate-spin" />
                Adding...
              </>
            ) : (
              "Add Location"
            )}
          </button>
        </form>
      </Modal>

      {/* Locations Grid */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
        {loading ? (
          <Loader message="Loading locations..." color="green-600" />
        ) : filteredLocations.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
            <p className="text-gray-700 font-semibold mb-2">No locations found</p>
            <p className="text-gray-500 text-sm">Create your first location to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLocations.map((location, idx) => (
              <motion.div
                key={location._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-2xl p-6 hover:shadow-lg transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-xl font-bold text-green-900">{location.name}</h3>
                  <span className="text-2xl">📍</span>
                </div>
                {location.description && (
                  <p className="text-sm text-green-800 mb-3">{location.description}</p>
                )}
                <div className="space-y-1 text-sm text-green-700">
                  {location.address && <p>📬 {location.address}</p>}
                  {location.city && <p>🏙️ {location.city}</p>}
                  {location.state && <p>🗺️ {location.state}</p>}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

ManageLocations.layoutType = "default";
ManageLocations.layoutProps = { title: "Manage Locations" };
