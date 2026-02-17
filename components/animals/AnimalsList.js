import { useEffect, useState, useRef, useContext } from "react";
import { FaSpinner, FaCheckCircle, FaTimesCircle, FaTimes, FaCheck, FaEdit, FaTrash } from "react-icons/fa";
import Link from "next/link";

import Modal from "../shared/Modal";
import Loader from "@/components/Loader";
import ImageViewer from "./ImageViewer";
import { BusinessContext } from "@/context/BusinessContext";
import { formatCurrency } from "@/utils/formatting";
import { useAnimalData } from "@/context/AnimalDataContext";

export default function AnimalsList({ searchTerm: parentSearchTerm = "", filterStatus: parentFilterStatus = "all" }) {
    const { businessSettings } = useContext(BusinessContext);
    const { animals: globalAnimals, loading: globalLoading, fetchAnimals, updateAnimalInCache, removeAnimalFromCache } = useAnimalData();
    // Modal state for image viewer
    const [imageModalOpen, setImageModalOpen] = useState(false);
    const [modalImages, setModalImages] = useState([]);
    const [modalAnimal, setModalAnimal] = useState(null);
  const [animals, setAnimals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editIndex, setEditIndex] = useState(null);
  const [editableAnimal, setEditableAnimal] = useState({});
  const [user, setUser] = useState(null);
  const [visibleCount, setVisibleCount] = useState(20);
  const [searchTerm, setSearchTerm] = useState(parentSearchTerm);
  const [filterStatus, setFilterStatus] = useState(parentFilterStatus);
  const [filteredAnimals, setFilteredAnimals] = useState([]);
  const [error, setError] = useState("");
  const [updateLoading, setUpdateLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);

  useEffect(() => {
    setSearchTerm(parentSearchTerm);
  }, [parentSearchTerm]);

  useEffect(() => {
    setFilterStatus(parentFilterStatus);
  }, [parentFilterStatus]);

  // Load animals from global context
  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (e) {
        console.error("Error parsing user data");
      }
    }
    fetchAnimals();
  }, []);

  // Sync local animals state with global context
  useEffect(() => {
    setAnimals(globalAnimals);
    if (globalAnimals.length > 0 || !globalLoading) {
      setLoading(false);
    }
  }, [globalAnimals, globalLoading]);

  useEffect(() => {
    // Filter animals based on search and status, then sort by status (alive first, dead last)
    let filtered = animals.filter((animal) => {
      const matchesSearch = !searchTerm || [animal.tagId, animal.name, animal.species, animal.breed]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesStatus = filterStatus === "all" || animal.status === filterStatus;
      
      return matchesSearch && matchesStatus;
    });
    
    // Sort: Alive first, Dead last
    filtered = filtered.sort((a, b) => {
      if (a.status === "Alive" && b.status !== "Alive") return -1;
      if (a.status !== "Alive" && b.status === "Alive") return 1;
      return 0;
    });
    
    setFilteredAnimals(filtered);
    setVisibleCount(20);
  }, [animals, searchTerm, filterStatus]);

  const handleEditClick = (index, animal) => {
    setEditIndex(index);
    setEditableAnimal({ ...animal });
    setError("");
  };

  const handleCancelClick = () => {
    setEditIndex(null);
    setEditableAnimal({});
    setError("");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditableAnimal((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdateClick = async (_id) => {
    try {
      setUpdateLoading(true);
      setError("");

      const token = localStorage.getItem("token");
      const res = await fetch(`/api/animals/${_id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(editableAnimal)
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update animal");
      }

      // Update global cache — targeted update, no re-fetch
      updateAnimalInCache(_id, editableAnimal);

      setEditIndex(null);
      setEditableAnimal({});
    } catch (err) {
      setError(err.message || "Failed to update animal");
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleDeleteClick = async (_id) => {
    if (!window.confirm("Are you sure you want to delete this animal? This action cannot be undone.")) return;

    try {
      setUpdateLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/animals/${_id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete animal");
      }

      // Remove from global cache — no need to re-fetch everything
      removeAnimalFromCache(_id);
    } catch (err) {
      setError(err.message || "Failed to delete animal");
    } finally {
      setUpdateLoading(false);
    }
  };

  const canDelete = user?.role === "SuperAdmin";
  const visibleAnimals = filteredAnimals.slice(0, visibleCount);

  if (loading) {
    return (
      <Loader message="Loading animals..." color="blue-600" />
    );
  }

  const handleImageClick = (animal) => {
    setModalImages(animal.images || []);
    setModalAnimal(animal);
    setImageModalOpen(true);
  };

  const handleDeleteImage = async (animalId, imageIndex) => {
    try {
      const token = localStorage.getItem("token");
      const animal = animals.find((a) => a._id === animalId);
      if (!animal) return;

      // Remove image from array
      const updatedImages = animal.images.filter((_, idx) => idx !== imageIndex);

      // Update animal
      const res = await fetch(`/api/animals/${animalId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ ...animal, images: updatedImages }),
      });

      if (res.ok) {
        // Update local state
        setModalImages(updatedImages);
        setAnimals((prev) =>
          prev.map((a) => (a._id === animalId ? { ...a, images: updatedImages } : a))
        );
      }
    } catch (error) {
      console.error("Failed to delete image:", error);
    }
  };

  const handleAddImage = async (animalId, e) => {
    try {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      setUploadingImages(true);
      
      const formData = new FormData();
      Array.from(files).forEach((file) => {
        formData.append("file", file);
      });

      const token = localStorage.getItem("token");
      
      // Upload images to server
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to upload images");
      }

      const responseData = await res.json();
      console.log("Upload response:", responseData);
      
      // Extract the links from the response (API returns { links, failedUploads, fields, message })
      const uploadedImages = responseData.links || [];
      
      if (!uploadedImages || uploadedImages.length === 0) {
        throw new Error("No images were uploaded successfully");
      }
      
      // Find the current animal
      const animal = animals.find((a) => a._id === animalId);
      if (!animal) {
        throw new Error("Animal not found");
      }

      // Combine existing and new images
      const updatedImages = [...(animal.images || []), ...uploadedImages];

      // Update animal record in database
      const updateRes = await fetch(`/api/animals/${animalId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ ...animal, images: updatedImages }),
      });

      if (!updateRes.ok) {
        const errorData = await updateRes.json();
        throw new Error(errorData.error || "Failed to save images to animal record");
      }

      // Update local state - keep modal open with fresh data
      const updatedAnimal = { ...animal, images: updatedImages };
      setModalImages(updatedImages);
      setModalAnimal(updatedAnimal);
      setAnimals((prev) =>
        prev.map((a) => (a._id === animalId ? updatedAnimal : a))
      );
      
      // Reset file input
      e.target.value = "";
      
      setUploadingImages(false);
      
    } catch (error) {
      console.error("Failed to add images:", error);
      setError(`Error uploading images: ${error.message}`);
      setUploadingImages(false);
      setTimeout(() => setError(""), 5000);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by tag ID, name, species, or breed..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-200"
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg">
          ⚠️ {error}
        </div>
      )}

      <div className="overflow-x-auto">
        {animals.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
            <p className="text-4xl mb-3">🐑</p>
            <p className="text-gray-700 font-semibold text-lg">No animals found</p>
            <p className="text-gray-500 text-sm mt-2">Start by adding your first animal to the system</p>
          </div>
        ) : filteredAnimals.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
            <p className="text-gray-700 font-semibold">No animals match your search</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-gray-100 border-b-2 border-gray-300">
                <th className="px-2 py-4 text-left text-xs font-bold text-gray-800 w-16">Edit</th>
                <th className="px-2 py-4 text-left text-xs font-bold text-gray-800 w-16">Adv</th>
                <th className="px-4 py-4 text-left text-sm font-bold text-gray-800">Photo</th>
                <th className="px-4 py-4 text-left text-sm font-bold text-gray-800">Tag ID</th>
                <th className="px-4 py-4 text-left text-sm font-bold text-gray-800 hidden sm:table-cell">Name</th>
                <th className="px-4 py-4 text-left text-sm font-bold text-gray-800 hidden md:table-cell">Species</th>
                <th className="px-4 py-4 text-left text-sm font-bold text-gray-800 hidden lg:table-cell">Breed</th>
                <th className="px-4 py-4 text-left text-sm font-bold text-gray-800">Status</th>
                <th className="px-4 py-4 text-center text-xs font-bold text-gray-800 hidden sm:table-cell">Weight</th>
                <th className="px-4 py-4 text-center text-xs font-bold text-gray-800 hidden lg:table-cell">Cost</th>
                <th className="px-4 py-4 text-center text-xs font-bold text-gray-800 hidden lg:table-cell">Feed Cost</th>
                <th className="px-4 py-4 text-center text-xs font-bold text-gray-800 hidden lg:table-cell">Med Cost</th>
                <th className="px-4 py-4 text-center text-xs font-bold text-gray-800 hidden lg:table-cell">Proj. Sales</th>
                <th className="px-4 py-4 text-center text-xs font-bold text-gray-800 hidden xl:table-cell">Profit</th>
                {canDelete && <th className="px-2 py-4 text-center text-xs font-bold text-gray-800 w-12">Del</th>}
              </tr>
            </thead>
            <tbody>
              {visibleAnimals.map((animal, index) => {
                const isEditing = editIndex === index;
                return (
                  <tr
                    key={animal._id}
                    className={`border-b transition-colors duration-200 ${
                      index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                    } ${isEditing ? 'bg-blue-50' : 'hover:bg-green-50'}`}
                  >
                    {/* Photo */}
                    <td className="px-2 py-4">
                      {animal.images && animal.images.length > 0 ? (
                        <img
                          src={animal.images[0].thumb || animal.images[0].full}
                          alt="Animal"
                          className="w-12 h-12 object-cover rounded-lg border cursor-pointer hover:opacity-80 transition"
                          onClick={() => handleImageClick(animal)}
                          title="Click to view all images"
                        />
                      ) : (
                        <button
                          onClick={() => handleImageClick(animal)}
                          className="text-blue-600 hover:text-blue-800 text-xs font-semibold cursor-pointer transition"
                          title="Click to add image"
                        >
                          No image
                        </button>
                      )}
                    </td>
                    {/* Edit Button */}
                    <td className="px-2 py-4">
                      {isEditing ? (
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={() => handleUpdateClick(animal._id)}
                            disabled={updateLoading}
                            className="w-full py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-semibold flex items-center justify-center gap-1"
                          >
                            <FaCheck size={10} /> Save
                          </button>
                          <button
                            onClick={handleCancelClick}
                            disabled={updateLoading}
                            className="w-full py-1 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded text-xs font-semibold flex items-center justify-center gap-1"
                          >
                            <FaTimes size={10} /> Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleEditClick(index, animal)}
                          className="w-full py-1 px-2 border border-blue-600 text-blue-700 hover:bg-blue-600 hover:text-white rounded text-xs font-semibold flex items-center justify-center gap-1 transition"
                        >
                          <FaEdit size={12} /> Edit
                        </button>
                      )}
                    </td>

                    {/* Advance Button */}
                    <td className="px-2 py-4">
                      <Link href={`/manage/animals/${animal._id}`}>
                        <button className="w-full py-1 px-2 border border-gray-400 text-gray-700 hover:bg-gray-700 hover:text-white rounded text-xs font-semibold transition">
                          Adv
                        </button>
                      </Link>
                    </td>

                    {/* Tag ID */}
                    <td className="px-4 py-4 text-xs font-semibold text-gray-900">
                      {isEditing ? (
                        <input
                          type="text"
                          name="tagId"
                          value={editableAnimal.tagId || ""}
                          onChange={handleChange}
                          className="border px-2 py-1 rounded w-24 text-xs"
                        />
                      ) : (
                        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-lg font-bold text-xs">
                          {animal.tagId}
                        </span>
                      )}
                    </td>

                    {/* Name */}
                    <td className="px-4 py-4 text-sm text-gray-800 font-medium hidden sm:table-cell">
                      {isEditing ? (
                        <input
                          type="text"
                          name="name"
                          value={editableAnimal.name || ""}
                          onChange={handleChange}
                          className="border px-2 py-1 rounded w-32 text-xs"
                        />
                      ) : (
                        animal.name || "—"
                      )}
                    </td>

                    {/* Species */}
                    <td className="px-4 py-4 text-sm hidden md:table-cell">
                      {isEditing ? (
                        <select
                          name="species"
                          value={editableAnimal.species || ""}
                          onChange={handleChange}
                          className="border px-2 py-1 rounded text-xs"
                        >
                          <option>Goat</option>
                          <option>Sheep</option>
                          <option>Cow</option>
                          <option>Pig</option>
                          <option>Chicken</option>
                        </select>
                      ) : (
                        <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-xs font-semibold">
                          {animal.species}
                        </span>
                      )}
                    </td>

                    {/* Breed */}
                    <td className="px-4 py-4 text-sm text-gray-700 hidden lg:table-cell">
                      {isEditing ? (
                        <input
                          type="text"
                          name="breed"
                          value={editableAnimal.breed || ""}
                          onChange={handleChange}
                          className="border px-2 py-1 rounded w-24 text-xs"
                        />
                      ) : (
                        animal.breed || "—"
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-4 text-sm">
                      {isEditing ? (
                        <select
                          name="status"
                          value={editableAnimal.status || ""}
                          onChange={handleChange}
                          className="border px-2 py-1 rounded text-xs"
                        >
                          <option value="Alive">Alive</option>
                          <option value="Sick">Sick</option>
                          <option value="Sold">Sold</option>
                          <option value="Dead">Dead</option>
                        </select>
                      ) : (
                        <div className="flex items-center gap-2">
                          {animal.status === "Alive" ? (
                            <>
                              <FaCheckCircle className="text-green-600" size={14} />
                              <span className="text-xs font-semibold text-green-700">Alive</span>
                            </>
                          ) : (
                            <>
                              <FaTimesCircle className="text-red-600" size={14} />
                              <span className="text-xs font-semibold text-red-700">{animal.status}</span>
                            </>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Records */}
                    <td className="px-4 py-4 text-center text-xs hidden sm:table-cell">
                      <div className="flex items-center justify-center gap-2 flex-wrap">
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-semibold">
                          ⚖️ {animal.currentWeight ? `${animal.currentWeight} kg` : "—"}
                        </span>
                      </div>
                    </td>

                    {/* Purchase Cost */}
                    <td className="px-4 py-4 text-center text-xs hidden lg:table-cell">
                      <span className="text-xs font-semibold text-gray-700">
                        {animal.purchaseCost ? formatCurrency(animal.purchaseCost, businessSettings.currency) : "—"}
                      </span>
                    </td>

                    {/* Feed Cost */}
                    <td className="px-4 py-4 text-center text-xs hidden lg:table-cell">
                      <span className="text-xs font-semibold text-orange-700">
                        {animal.totalFeedCost ? formatCurrency(animal.totalFeedCost, businessSettings.currency) : "—"}
                      </span>
                    </td>

                    {/* Medication Cost */}
                    <td className="px-4 py-4 text-center text-xs hidden lg:table-cell">
                      <span className="text-xs font-semibold text-red-700">
                        {animal.totalMedicationCost ? formatCurrency(animal.totalMedicationCost, businessSettings.currency) : "—"}
                      </span>
                    </td>

                    {/* Projected Sales */}
                    <td className="px-4 py-4 text-center text-xs hidden lg:table-cell">
                      <span className="text-xs font-semibold text-green-700">
                        {animal.projectedSalesPrice ? formatCurrency(animal.projectedSalesPrice, businessSettings.currency) : "—"}
                      </span>
                    </td>

                    {/* Estimated Profit */}
                    <td className="px-4 py-4 text-center text-xs hidden xl:table-cell">
                      {(() => {
                        const totalCost = (animal.purchaseCost || 0) + (animal.totalFeedCost || 0) + (animal.totalMedicationCost || 0);
                        const profit = (animal.projectedSalesPrice || 0) - totalCost;
                        return (
                          <span className={`text-xs font-bold px-2 py-1 rounded-full ${profit >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {profit >= 0 ? "+" : ""}{formatCurrency(profit, businessSettings.currency)}
                          </span>
                        );
                      })()}
                    </td>

                    {/* Delete Button */}
                    {canDelete && (
                      <td className="px-2 py-4 text-center">
                        <button
                          onClick={() => handleDeleteClick(animal._id)}
                          disabled={updateLoading}
                          className="w-full py-1 px-2 bg-red-50 text-red-700 border border-red-300 hover:bg-red-600 hover:text-white rounded text-xs font-semibold flex items-center justify-center gap-1 transition disabled:opacity-50"
                        >
                          <FaTrash size={12} /> X
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Load More */}
      {visibleCount < filteredAnimals.length && (
        <div className="flex justify-center mt-6">
          <button
            onClick={() => setVisibleCount((v) => v + 20)}
            className="py-2 px-6 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition"
          >
            Load more ({filteredAnimals.length - visibleCount} remaining)
          </button>
        </div>
      )}
      {/* Image Modal */}
      <Modal isOpen={imageModalOpen} onClose={() => setImageModalOpen(false)} title={modalAnimal ? `${modalAnimal.name || modalAnimal.tagId} - Image Gallery` : "Animal Image Gallery"} size="2xl">
        <ImageViewer 
          images={modalImages} 
          animalName={modalAnimal?.name || modalAnimal?.tagId || "Animal"}
          onDeleteImage={(imageIndex) => handleDeleteImage(modalAnimal._id, imageIndex)}
          onAddImage={(e) => handleAddImage(modalAnimal._id, e)}
          isUploading={uploadingImages}
        />
      </Modal>
    </div>
  );
}
