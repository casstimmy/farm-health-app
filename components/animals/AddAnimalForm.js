import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { FaTag, FaPaw, FaSpinner, FaCheck } from "react-icons/fa";

export default function AddAnimalForm({ onSuccess }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [locations, setLocations] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [formData, setFormData] = useState({
    tagId: "",
    name: "",
    species: "Goat",
    breed: "",
    gender: "Male",
    dob: "",
    location: "",
    paddock: ""
  });

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      setLoadingLocations(true);
      const token = localStorage.getItem("token");
      const res = await fetch("/api/locations", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setLocations(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching locations:", error);
    } finally {
      setLoadingLocations(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/animals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to add animal");
        return;
      }

      setSuccess(`✓ ${formData.name || formData.tagId} has been added successfully!`);
      
      setFormData({
        tagId: "",
        name: "",
        species: "Goat",
        breed: "",
        gender: "Male",
        dob: "",
        location: "",
        paddock: ""
      });

      setTimeout(() => {
        if (onSuccess) onSuccess();
      }, 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <div className="error-message flex items-center gap-2"><span>⚠️</span> {error}</div>}
      {success && <div className="success-message flex items-center gap-2"><FaCheck /> {success}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Tag ID */}
        <div>
          <label className="label flex items-center gap-2">
            <FaTag size={14} className="text-green-600" />
            Tag ID <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="tagId"
            required
            value={formData.tagId}
            onChange={handleChange}
            className="input-field"
            placeholder="e.g., BGM001"
          />
        </div>

        {/* Name */}
        <div>
          <label className="label">Animal Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="input-field"
            placeholder="e.g., Gentle Kay"
          />
        </div>

        {/* Species */}
        <div>
          <label className="label">Species</label>
          <select
            name="species"
            value={formData.species}
            onChange={handleChange}
            className="input-field"
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
          <label className="label">Breed</label>
          <input
            type="text"
            name="breed"
            value={formData.breed}
            onChange={handleChange}
            className="input-field"
            placeholder="e.g., Boer"
          />
        </div>

        {/* Gender */}
        <div>
          <label className="label">Gender</label>
          <select
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            className="input-field"
          >
            <option value="Male">Male ♂️</option>
            <option value="Female">Female ♀️</option>
          </select>
        </div>

        {/* Date of Birth */}
        <div>
          <label className="label">Date of Birth</label>
          <input
            type="date"
            name="dob"
            value={formData.dob}
            onChange={handleChange}
            className="input-field"
          />
        </div>

        {/* Location - Now Select from Database */}
        <div>
          <label className="label">Location *</label>
          <select
            name="location"
            value={formData.location}
            onChange={handleChange}
            required
            disabled={loadingLocations}
            className="input-field"
          >
            <option value="">Select a location...</option>
            {loadingLocations ? (
              <option disabled>Loading locations...</option>
            ) : locations.length === 0 ? (
              <option disabled>No locations available</option>
            ) : (
              locations.map((loc) => (
                <option key={loc._id} value={loc._id}>
                  📍 {loc.name} {loc.city ? `(${loc.city})` : ""}
                </option>
              ))
            )}
          </select>
          {locations.length === 0 && !loadingLocations && (
            <p className="text-xs text-orange-600 mt-1">👉 No locations found. Create one in Setup → Manage Locations</p>
          )}
        </div>

        {/* Paddock */}
        <div>
          <label className="label">Paddock/Shed</label>
          <input
            type="text"
            name="paddock"
            value={formData.paddock}
            onChange={handleChange}
            className="input-field"
            placeholder="e.g., RP1"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading || !formData.location}
        className="btn-primary-lg w-full flex items-center justify-center gap-2 disabled:opacity-60"
      >
        {loading ? (
          <>
            <FaSpinner className="animate-spin" />
            Adding Animal...
          </>
        ) : (
          <>
            <FaCheck />
            Add Animal
          </>
        )}
      </button>
    </form>
  );
}
