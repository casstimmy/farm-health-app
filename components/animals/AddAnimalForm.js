import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { FaTag, FaPaw, FaSpinner, FaCheck, FaImage, FaTimes, FaCamera } from "react-icons/fa";

export default function AddAnimalForm({ onSuccess }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [locations, setLocations] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);
  
  const [formData, setFormData] = useState({
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

  useEffect(() => {
    fetchLocations();
    // Get current user from localStorage
    const user = localStorage.getItem("user");
    if (user) {
      try {
        const userData = JSON.parse(user);
        setFormData(prev => ({ ...prev, recordedBy: userData.name }));
      } catch (e) {
        console.error("Error parsing user data");
      }
    }
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

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    setImageFiles(files);
    const previews = [];
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        previews.push(reader.result);
        if (previews.length === files.length) {
          setImagePreview(previews);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const uploadImage = async () => {
    if (!imageFiles.length) {
      setError("Please select image(s) first");
      return;
    }
    setUploadingImage(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const uploadedImages = [];
      for (const file of imageFiles) {
        const reader = new FileReader();
        const fileReadPromise = new Promise((resolve, reject) => {
          reader.onload = async () => {
            try {
              const res = await fetch("/api/upload", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ file: reader.result })
              });
              const data = await res.json();
              if (!res.ok) {
                reject(data.error || "Failed to upload image");
                return;
              }
              uploadedImages.push({ full: data.full, thumb: data.thumb });
              resolve();
            } catch (err) {
              reject(err.message || "Error uploading image");
            }
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        await fileReadPromise;
      }
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...uploadedImages]
      }));
      setImagePreview([]);
      setImageFiles([]);
      setSuccess(`✓ ${uploadedImages.length} image(s) uploaded successfully!`);
      setTimeout(() => setSuccess("");
      setUploadingImage(false);
    } catch (err) {
      setError(err.message || "Error uploading image");
      setUploadingImage(false);
    }
  };

  const removeImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
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

      const res = await fetch("/api/animals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(submitData)
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to add animal");
        return;
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
            <input
              type="text"
              name="recordedBy"
              value={formData.recordedBy}
              onChange={handleChange}
              className="input-field"
              placeholder="Your name"
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

        {/* Image Preview and Upload */}
        <div className="flex gap-4 mb-4">
          <div className="flex-1">
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-indigo-300 rounded-lg p-6 cursor-pointer hover:bg-indigo-100 transition-all">
              <FaCamera className="text-indigo-600 text-3xl mb-2" />
              <span className="text-sm font-semibold text-indigo-700">Click to select images</span>
              <span className="text-xs text-indigo-600">PNG, JPG, GIF up to 5MB each</span>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageSelect}
                className="hidden"
              />
            </label>
          </div>

          {imagePreview && imagePreview.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {imagePreview.map((src, idx) => (
                <div key={idx} className="relative">
                  <img
                    src={src}
                    alt={`Preview ${idx + 1}`}
                    className="w-24 h-24 object-cover rounded-lg border-2 border-indigo-300"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upload Button */}
        {imageFiles.length > 0 && (
          <button
            type="button"
            onClick={uploadImage}
            disabled={uploadingImage}
            className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg disabled:opacity-60 flex items-center justify-center gap-2 mb-4"
          >
            {uploadingImage ? (
              <>
                <FaSpinner className="animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <FaCamera />
                Upload {imageFiles.length > 1 ? `(${imageFiles.length}) Images` : "Image"}
              </>
            )}
          </button>
        )}

        {/* Uploaded Images */}
        {formData.images.length > 0 && (
          <div className="mt-4">
            <h4 className="font-semibold text-indigo-900 mb-2">Uploaded Images ({formData.images.length})</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {formData.images.map((image, index) => (
                <div key={index} className="relative group">
                  <img
                    src={image.thumb}
                    alt={`Animal ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg border-2 border-indigo-300"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <FaTimes size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* SUBMIT BUTTON */}
      <button
        type="submit"
        disabled={loading || !formData.location}
        className="btn-primary-lg w-full flex items-center justify-center gap-2 disabled:opacity-60 sticky bottom-0 bg-green-600 hover:bg-green-700"
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
