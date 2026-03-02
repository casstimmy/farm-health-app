import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { FaTag, FaPaw, FaSpinner, FaCheck, FaImage, FaTimes, FaCamera } from "react-icons/fa";
import Loader from "../Loader";
import { useAnimalData } from "@/context/AnimalDataContext";

export default function AddAnimalForm({ onSuccess, animal }) {
    const { animals: allAnimals, addAnimalToCache } = useAnimalData();
    const [users, setUsers] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    // Fetch all users for the Recorded By dropdown
    useEffect(() => {
      const fetchUsers = async () => {
        setLoadingUsers(true);
        try {
          const token = localStorage.getItem("token");
          const res = await fetch("/api/users", {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await res.json();
          if (Array.isArray(data)) setUsers(data);
        } catch (err) {
          setUsers([]);
        } finally {
          setLoadingUsers(false);
        }
      };
      fetchUsers();
    }, []);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [locations, setLocations] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [uploadingImage, setUploadingImage] = useState(false);
  const [images, setImages] = useState([]);
  const [loadingImages, setLoadingImages] = useState(false);
  
  const [formData, setFormData] = useState({
          tagId: animal?.tagId || "",
    myNotes: "",
    name: "",
    species: "Goat",
    breed: "",
    origin: "",
    class: "",
    gender: "Male",
    dob: "",
    acquisitionType: "Bred on farm",
    acquisitionDate: "",
    sire: "",
    dam: "",
    status: "Alive",
    location: "",
    paddock: "",
    currentWeight: "",
    projectedMaxWeight: "",
    purchaseCost: "",
    marginPercent: "30",
    projectedSalesPrice: "",
    weightDate: "",
    recordedBy: "",
    notes: "",
    images: []
  });
        
        useEffect(() => {
          if (animal) {
            setFormData(prev => ({ ...prev, ...animal }));
          }
        }, [animal]);

  useEffect(() => {
    fetchLocations();
    // Get current user from localStorage and set as default for recordedBy if not editing
    const user = localStorage.getItem("user");
    if (user && !(animal && (animal._id || animal.id))) {
      try {
        const userData = JSON.parse(user);
        setFormData(prev => ({ ...prev, recordedBy: userData.name }));
      } catch (e) {
        console.error("Error parsing user data");
      }
    }
    // if editing an existing animal, seed previews
    if (animal && animal.images && animal.images.length > 0) {
      setImages(animal.images);
      setFormData(prev => ({ ...prev, images: animal.images }));
    }
  }, [animal]);

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

  // Filter animals for sire (Male) and dam (Female) dropdowns
  const maleAnimals = (allAnimals || []).filter(
    (a) => a.gender === "Male" && a.status === "Alive" && !a.isArchived && a._id !== (animal?._id || animal?.id)
  );
  const femaleAnimals = (allAnimals || []).filter(
    (a) => a.gender === "Female" && a.status === "Alive" && !a.isArchived && a._id !== (animal?._id || animal?.id)
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear field-specific error when user types
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  // Handle currency input: strip commas for state, display with commas
  const handleCurrencyChange = (e) => {
    const { name } = e.target;
    const raw = e.target.value.replace(/,/g, "");
    if (raw === "" || /^\d*\.?\d*$/.test(raw)) {
      setFormData(prev => ({ ...prev, [name]: raw }));
      if (fieldErrors[name]) {
        setFieldErrors(prev => ({ ...prev, [name]: "" }));
      }
    }
  };

  const formatWithCommas = (value) => {
    if (!value && value !== 0) return "";
    const str = String(value).replace(/,/g, "");
    if (!str || isNaN(str)) return str;
    const parts = str.split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
  };

  const handleImageSelect = async (e) => {
    const files = e.target.files;
    if (!files?.length) return;
    setLoadingImages(true);
    const formDataUpload = new FormData();
    for (const f of files) formDataUpload.append("file", f);
    // Show temp previews
    const previews = Array.from(files).map((f) => ({
      full: URL.createObjectURL(f),
      thumb: URL.createObjectURL(f),
      isTemp: true,
    }));
    setImages((prev) => [...prev, ...previews]);
    try {
      const res = await axios.post("/api/upload", formDataUpload);
      const uploaded = res.data?.links || [];
      // replace temp previews with uploaded images, keep any existing uploaded images
      setImages((prev) => [
        ...prev.filter((img) => !img.isTemp),
        ...uploaded,
      ]);
      // append uploaded objects to formData.images (source of truth for saved images)
      setFormData((prev) => ({ ...prev, images: [...prev.images, ...uploaded] }));
    } catch (err) {
      // remove temp previews on error
      setImages((prev) => prev.filter((img) => !img.isTemp));
      console.error("Image upload failed", err);
    } finally {
      setLoadingImages(false);
    }
  };

  // No uploadImage function needed, handled in handleImageSelect

  const removeImage = (image) => {
    // image can be an object with full/thumb or a temp preview
    const url = image?.full || image?.thumb;
    if (!url) return;
    setImages((prev) => prev.filter((img) => img.full !== url && img.thumb !== url));
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((img) => img.full !== url && img.thumb !== url),
    }));
  };

  // Drag-and-drop reordering (HTML5)
  const dragSrc = useRef(null);

  const handleDragStart = (e, index) => {
    dragSrc.current = index;
    try {
      e.dataTransfer.effectAllowed = "move";
    } catch (err) {}
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    try {
      e.dataTransfer.dropEffect = "move";
    } catch (err) {}
  };

  const handleDrop = (e, index) => {
    e.preventDefault();
    const src = dragSrc.current;
    if (src === null || src === undefined) return;
    if (src === index) {
      dragSrc.current = null;
      return;
    }
    setFormData((prev) => {
      const arr = [...prev.images];
      const [item] = arr.splice(src, 1);
      arr.splice(index, 0, item);
      return { ...prev, images: arr };
    });
    dragSrc.current = null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Field-level validation
    const errors = {};
    if (!formData.tagId?.trim()) errors.tagId = "Tag ID is required";
    if (!formData.location) errors.location = "Location is required";
    if (!formData.species) errors.species = "Species is required";
    if (!formData.gender) errors.gender = "Gender is required";
    if (formData.currentWeight && isNaN(parseFloat(formData.currentWeight))) errors.currentWeight = "Must be a valid number";
    if (formData.purchaseCost && isNaN(parseFloat(String(formData.purchaseCost).replace(/,/g, "")))) errors.purchaseCost = "Must be a valid number";
    
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError(Object.values(errors)[0]);
      return;
    }
    setFieldErrors({});

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem("token");
      const submitData = {
        ...formData,
        currentWeight: formData.currentWeight ? parseFloat(String(formData.currentWeight).replace(/,/g, "")) : 0,
        projectedMaxWeight: formData.projectedMaxWeight ? parseFloat(String(formData.projectedMaxWeight).replace(/,/g, "")) : 0,
        purchaseCost: formData.purchaseCost ? parseFloat(String(formData.purchaseCost).replace(/,/g, "")) : 0,
        marginPercent: formData.marginPercent ? parseFloat(String(formData.marginPercent).replace(/,/g, "")) : 30,
        projectedSalesPrice: formData.projectedSalesPrice ? parseFloat(String(formData.projectedSalesPrice).replace(/,/g, "")) : 0,
        weightDate: formData.weightDate || new Date(),
        dob: formData.dob || null,
        acquisitionDate: formData.acquisitionDate || null
      };

      // determine if we're editing or creating
      const isEdit = animal && (animal._id || animal.id);
      const url = isEdit ? `/api/animals/${animal._id || animal.id}` : "/api/animals";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(submitData)
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || (isEdit ? "Failed to update animal" : "Failed to add animal"));
        return;
      }

      if (isEdit) {
        setSuccess(`✓ ${formData.name || formData.tagId} has been updated successfully!`);
        setTimeout(() => {
          if (onSuccess) onSuccess();
        }, 1000);
      } else {
        // Add the newly created animal to cache immediately
        if (data && data._id) {
          addAnimalToCache(data);
        }
        setSuccess(`✓ ${formData.name || formData.tagId} has been added successfully!`);
        setFormData({
          tagId: "",
          myNotes: "",
          name: "",
          species: "Goat",
          breed: "",
          origin: "",
          class: "",
          gender: "Male",
          dob: "",
          acquisitionType: "Bred on farm",
          acquisitionDate: "",
          sire: "",
          dam: "",
          status: "Alive",
          location: "",
          paddock: "",
          currentWeight: "",
          projectedMaxWeight: "",
          purchaseCost: "",
          marginPercent: "30",
          projectedSalesPrice: "",
          weightDate: "",
          recordedBy: "",
          notes: "",
          images: []
        });

        setTimeout(() => {
          if (onSuccess) onSuccess();
        }, 1500);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto pr-4">
      {error && <div className="error-message flex items-center gap-2"><span>⚠️</span> {error}</div>}
      {success && <div className="success-message flex items-center gap-2"><FaCheck /> {success}</div>}

      {/* BASIC INFORMATION */}
      <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
        <h3 className="font-bold text-blue-900 mb-4 flex items-center gap-2">📋 Basic Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
              className={`input-field ${fieldErrors.tagId ? "border-red-500 ring-1 ring-red-300" : ""}`}
              placeholder="e.g., BGM001"
            />
            {fieldErrors.tagId && <p className="text-red-500 text-xs mt-1">{fieldErrors.tagId}</p>}
          </div>

          {/* My Notes */}
          <div>
            <label className="label">My Notes</label>
            <input
              type="text"
              name="myNotes"
              value={formData.myNotes}
              onChange={handleChange}
              className="input-field"
              placeholder="e.g., Stud male"
            />
          </div>

          {/* Animal Name */}
          <div>
            <label className="label">Animal Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="input-field"
              placeholder="e.g., Amina"
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

          {/* Origin */}
          <div>
            <label className="label">Origin</label>
            <input
              type="text"
              name="origin"
              value={formData.origin}
              onChange={handleChange}
              className="input-field"
              placeholder="e.g., South Africa"
            />
          </div>

          {/* Class */}
          <div>
            <label className="label">Class</label>
            <select
              name="class"
              value={formData.class}
              onChange={handleChange}
              className="input-field"
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
        </div>
      </div>

      {/* ACQUISITION INFORMATION */}
      <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
        <h3 className="font-bold text-green-900 mb-4">🛒 Acquisition Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Acquisition Type */}
          <div>
            <label className="label">Acquisition Type</label>
            <select
              name="acquisitionType"
              value={formData.acquisitionType}
              onChange={handleChange}
              className="input-field"
            >
              <option value="Bred on farm">Bred on farm</option>
              <option value="Purchased">Purchased</option>
              <option value="Donated">Donated</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Acquisition Date */}
          <div>
            <label className="label">Acquisition Date</label>
            <input
              type="date"
              name="acquisitionDate"
              value={formData.acquisitionDate}
              onChange={handleChange}
              className="input-field"
            />
          </div>

          {/* Sire ID */}
          <div>
            <label className="label">Sire (Father)</label>
            <select
              name="sire"
              value={formData.sire}
              onChange={handleChange}
              className="input-field"
            >
              <option value="">-- Select Sire --</option>
              {maleAnimals.map((a) => (
                <option key={a._id} value={a._id}>
                  {a.name ? `${a.name} (${a.tagId})` : a.tagId} — {a.breed || ""}
                </option>
              ))}
            </select>
          </div>

          {/* Dam ID */}
          <div>
            <label className="label">Dam (Mother)</label>
            <select
              name="dam"
              value={formData.dam}
              onChange={handleChange}
              className="input-field"
            >
              <option value="">-- Select Dam --</option>
              {femaleAnimals.map((a) => (
                <option key={a._id} value={a._id}>
                  {a.name ? `${a.name} (${a.tagId})` : a.tagId} — {a.breed || ""}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* LOCATION & STATUS */}
      <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4">
        <h3 className="font-bold text-purple-900 mb-4">📍 Location & Status</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Location */}
          <div>
            <label className="label">Location <span className="text-red-500">*</span></label>
            <select
              name="location"
              value={formData.location}
              onChange={handleChange}
              required
              disabled={loadingLocations}
              className={`input-field ${fieldErrors.location ? "border-red-500 ring-1 ring-red-300" : ""}`}
            >
              <option value="">Select a location...</option>
              {loadingLocations ? (
                <option disabled>Loading locations...</option>
              ) : locations.length === 0 ? (
                <option disabled>No locations available</option>
              ) : (
                locations.map((loc) => (
                  <option key={loc._id} value={loc._id}>
                    {loc.name} {loc.city ? `(${loc.city})` : ""}
                  </option>
                ))
              )}
            </select>
            {fieldErrors.location && <p className="text-red-500 text-xs mt-1">{fieldErrors.location}</p>}
          </div>

          {/* Paddock/Shed */}
          <div>
            <label className="label">Paddock/Shed</label>
            {(() => {
              const selectedLoc = locations.find((l) => l._id === formData.location);
              const paddocks = selectedLoc?.paddocks || [];
              return paddocks.length > 0 ? (
                <select
                  name="paddock"
                  value={formData.paddock}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option value="">Select Paddock/Shed</option>
                  {paddocks.map((p) => (
                    <option key={p._id} value={p.name}>
                      {p.name} ({p.type}{p.capacity ? ` · Cap: ${p.capacity}` : ""})
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  name="paddock"
                  value={formData.paddock}
                  onChange={handleChange}
                  className="input-field"
                  placeholder={formData.location ? "No paddocks for this location" : "Select a location first"}
                />
              );
            })()}
          </div>

          {/* Status */}
          <div>
            <label className="label">Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="input-field"
            >
              <option value="Alive">Alive ✓</option>
              <option value="Quarantined">Quarantined</option>
              <option value="Sold">Sold 💰</option>
              <option value="Dead">Dead ✗</option>
            </select>
          </div>
        </div>
      </div>

      {/* WEIGHT & RECORDED INFO */}
      <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-4">
        <h3 className="font-bold text-orange-900 mb-4">⚖️ Weight & Recording</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Weight */}
          <div>
            <label className="label">Weight (kg)</label>
            <input
              type="number"
              name="currentWeight"
              value={formData.currentWeight}
              onChange={handleChange}
              className="input-field"
              placeholder="e.g., 25.5"
              step="0.1"
              min="0"
            />
          </div>

          {/* Weight Date */}
          <div>
            <label className="label">Weight Date</label>
            <input
              type="date"
              name="weightDate"
              value={formData.weightDate}
              onChange={handleChange}
              className="input-field"
            />
          </div>

          {/* Recorded By */}
          <div>
            <label className="label">Recorded By</label>
            <select
              name="recordedBy"
              value={formData.recordedBy}
              onChange={handleChange}
              className="input-field"
              required
              disabled={loadingUsers}
            >
              <option value="">
                {loadingUsers
                  ? "Loading users..."
                  : users.length === 0
                  ? "No users available"
                  : formData.recordedBy
                  ? "Select user"
                  : "Select user (active user shown)"}
              </option>
              {users.map((user) => (
                <option key={user._id} value={user.name}>
                  {user.name} {user.role ? `(${user.role})` : ""}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* FINANCIAL INFO */}
      <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-4">
        <h3 className="font-bold text-emerald-900 mb-4">💰 Financial & Projections</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="label">Projected Max Weight (kg)</label>
            <input
              type="number"
              name="projectedMaxWeight"
              value={formData.projectedMaxWeight}
              onChange={handleChange}
              className="input-field"
              placeholder="e.g., 70"
              step="0.1"
              min="0"
            />
          </div>
          <div>
            <label className="label">Purchase Cost</label>
            <input
              type="text"
              name="purchaseCost"
              value={formatWithCommas(formData.purchaseCost)}
              onChange={(e) => {
                const raw = e.target.value.replace(/,/g, "");
                if (raw === "" || /^\d*\.?\d*$/.test(raw)) {
                  const pc = parseFloat(raw) || 0;
                  const mp = parseFloat(formData.marginPercent) || 0;
                  setFormData((prev) => ({
                    ...prev,
                    purchaseCost: raw,
                    projectedSalesPrice: mp > 0 ? (pc * (1 + mp / 100)).toFixed(2) : prev.projectedSalesPrice,
                  }));
                }
              }}
              className={`input-field ${fieldErrors.purchaseCost ? "border-red-500" : ""}`}
              placeholder="e.g., 15,000"
            />
            {fieldErrors.purchaseCost && <p className="text-red-500 text-xs mt-1">{fieldErrors.purchaseCost}</p>}
          </div>
          <div>
            <label className="label">Margin %</label>
            <input
              type="number"
              name="marginPercent"
              value={formData.marginPercent}
              onChange={(e) => {
                const mp = parseFloat(e.target.value) || 0;
                const pc = parseFloat(String(formData.purchaseCost).replace(/,/g, "")) || 0;
                setFormData((prev) => ({
                  ...prev,
                  marginPercent: e.target.value,
                  projectedSalesPrice: pc > 0 ? (pc * (1 + mp / 100)).toFixed(2) : prev.projectedSalesPrice,
                }));
              }}
              className="input-field"
              placeholder="e.g., 30"
              step="0.1"
              min="0"
            />
          </div>
          <div>
            <label className="label">Projected Sales Price</label>
            <input
              type="text"
              name="projectedSalesPrice"
              value={formatWithCommas(formData.projectedSalesPrice)}
              onChange={(e) => {
                const raw = e.target.value.replace(/,/g, "");
                if (raw === "" || /^\d*\.?\d*$/.test(raw)) {
                  setFormData(prev => ({ ...prev, projectedSalesPrice: raw }));
                }
              }}
              className="input-field"
              placeholder="Auto-calculated or enter"
            />
          </div>
        </div>
      </div>

      {/* NOTES */}
      <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-4">
        <h3 className="font-bold text-gray-900 mb-4">📝 Additional Notes</h3>
        
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          className="input-field"
          placeholder="Add any additional notes about this animal..."
          rows="3"
        />
      </div>

      {/* IMAGE UPLOAD */}
      <div className="bg-indigo-50 border-2 border-indigo-200 rounded-xl p-4">
        <h3 className="font-bold text-indigo-900 mb-4 flex items-center gap-2">
          <FaImage /> Animal Photos
        </h3>

        {/* Image Upload Section */}
        <div className="space-y-4">
          {/* Upload Area */}
          <label className="relative block border-2 border-dashed border-indigo-300 rounded-xl p-8 text-center cursor-pointer hover:bg-indigo-50 bg-indigo-50 transition-colors">
            <div className="space-y-3">
              <FaCamera className="mx-auto text-4xl text-indigo-600" />
              <div>
                <p className="font-semibold text-indigo-900">Click to upload images</p>
                <p className="text-sm text-gray-600">or drag and drop</p>
                <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF up to 10MB</p>
              </div>
            </div>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
          </label>

          {/* Preview Area */}
          {(images.length > 0 || loadingImages) && (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-sm font-semibold text-gray-700 mb-3">Preview ({images.length})</p>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {images.map((img, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative flex-shrink-0 group"
                  >
                    <img
                      src={img.thumb || img.full}
                      alt={`Preview ${i + 1}`}
                      className="w-32 h-32 object-cover rounded-lg border border-gray-300"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(img)}
                      className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                      title="Remove image"
                    >
                      <FaTimes size={14} />
                    </button>
                    <span className="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                      {i + 1}
                    </span>
                  </motion.div>
                ))}
                {loadingImages && (
                  <div className="w-32 h-32 flex items-center justify-center bg-gray-100 rounded-lg">
                    <Loader size="sm" />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Uploaded Images Gallery */}
          {formData.images.length > 0 && (
            <div className="bg-white rounded-lg border border-green-200 bg-green-50 p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-green-900">✓ Uploaded ({formData.images.length})</p>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Ready</span>
              </div>
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {formData.images.map((image, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative group rounded-lg overflow-hidden border-2 border-green-300 hover:border-green-500 transition-colors"
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, index)}
                  >
                    <img
                      src={image.thumb}
                      alt={`Uploaded ${index + 1}`}
                      className="w-full aspect-square object-cover"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => removeImage(image)}
                        className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove"
                      >
                        <FaTimes size={14} />
                      </button>
                    </div>
                    <span className="absolute top-1 right-1 bg-green-500 text-white text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full">
                      {index + 1}
                    </span>
                  </motion.div>
                ))}
              </div>
              <p className="text-xs text-gray-600 mt-3">💡 Drag to reorder images</p>
            </div>
          )}
        </div>
      </div>

      {/* ACTIONS: Cancel + Submit */}
      <div className="flex gap-3 sticky bottom-0 bg-white py-3 border-t">
        <button
          type="button"
          onClick={() => {
            if (onSuccess) return onSuccess();
            router.back();
          }}
          className="flex-1 btn-secondary-lg disabled:opacity-60 border rounded-lg px-4 py-2"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={loading || loadingImages || !formData.location}
          className="flex-1 btn-primary-lg flex items-center justify-center gap-2 disabled:opacity-60 bg-green-600 hover:bg-green-700 rounded-lg px-4 py-2"
        >
          {loading ? (
            <>
              <FaSpinner className="animate-spin" />
              {animal ? "Saving..." : "Adding Animal..."}
            </>
          ) : loadingImages ? (
            <>
              <FaSpinner className="animate-spin" />
              Uploading Images...
            </>
          ) : (
            <>
              <FaCheck />
              {animal ? "Save Changes" : "Add Animal"}
            </>
          )}
        </button>
      </div>
    </form>
  );
}
