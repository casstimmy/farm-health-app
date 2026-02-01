import { useState, useEffect, useRef } from "react";
import axios from "axios";
import axios from "axios";
import { useRouter } from "next/router";
import { FaTag, FaPaw, FaSpinner, FaCheck, FaImage, FaTimes, FaCamera } from "react-icons/fa";
import Loader from "../Loader";

export default function AddAnimalForm({ onSuccess, animal }) {
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
    sireId: "",
    damId: "",
    status: "Alive",
    location: "",
    paddock: "",
    weight: "",
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
    
    if (!formData.tagId) {
      setError("Tag ID is required");
      return;
    }
    if (!formData.location) {
      setError("Location is required");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem("token");
      const submitData = {
        ...formData,
        weight: formData.weight ? parseFloat(formData.weight) : 0,
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
        // keep form data (updated) and call onSuccess
        setTimeout(() => {
          if (onSuccess) onSuccess();
        }, 1000);
      } else {
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
          sireId: "",
          damId: "",
          status: "Alive",
          location: "",
          paddock: "",
          weight: "",
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
              className="input-field"
              placeholder="e.g., BGM001"
            />
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
              <option value="Imported">Imported</option>
              <option value="Gift">Gift</option>
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
            <label className="label">Sire ID (Father)</label>
            <input
              type="text"
              name="sireId"
              value={formData.sireId}
              onChange={handleChange}
              className="input-field"
              placeholder="e.g., BGM001"
            />
          </div>

          {/* Dam ID */}
          <div>
            <label className="label">Dam ID (Mother)</label>
            <input
              type="text"
              name="damId"
              value={formData.damId}
              onChange={handleChange}
              className="input-field"
              placeholder="e.g., BGF001"
            />
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
                    {loc.name} {loc.city ? `(${loc.city})` : ""}
                  </option>
                ))
              )}
            </select>
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
              <option value="Sick">Sick 🤒</option>
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
              name="weight"
              value={formData.weight}
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

        {/* Image Preview and Upload */}
        <div className="flex gap-4 mb-4">
          <div className="flex gap-2 md:gap-3 flex-wrap">
            <label className="w-24 h-24 md:w-28 md:h-28 flex items-center justify-center border-2 border-dashed rounded-md cursor-pointer bg-gray-50 text-gray-400 hover:bg-gray-100 text-xs md:text-sm text-center p-1">
              + Upload
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
            </label>

            {images.map((img, i) => (
              <div
                key={i}
                className="relative w-24 h-24 md:w-28 md:h-28 rounded-md overflow-hidden border"
              >
                <img
                  src={img.thumb || img.full}
                  alt="Animal"
                  className="object-cover w-full h-full"
                />
                <button
                  type="button"
                  className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded"
                  onClick={() => removeImage(img)}
                >
                  <FaTimes size={12} />
                </button>
              </div>
            ))}

            {loadingImages && (
              <div className="w-24 h-24 md:w-28 md:h-28 flex items-center justify-center">
                <Loader />
              </div>
            )}
          </div>
        </div>

        {/* Upload Button */}
        {/* No upload button needed, handled automatically */}

        {/* Uploaded Images */}
        {formData.images.length > 0 && (
          <div className="mt-4">
            <h4 className="font-semibold text-indigo-900 mb-2">Uploaded Images ({formData.images.length})</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {formData.images.map((image, index) => (
                <div
                  key={index}
                  className="relative group"
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, index)}
                >
                  <img
                    src={image.thumb}
                    alt={`Animal ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg border-2 border-indigo-300"
                  />
                  <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => removeImage(image)}
                      className="bg-red-600 text-white rounded-full p-1"
                      title="Remove"
                    >
                      <FaTimes size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ACTIONS: Cancel + Submit */}
      <div className="flex gap-3 sticky bottom-0 bg-white py-3">
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
