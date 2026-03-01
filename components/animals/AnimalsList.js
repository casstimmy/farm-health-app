import { useContext, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { FaCheck, FaEdit, FaTrash, FaTimes } from "react-icons/fa";
import Modal from "../shared/Modal";
import Loader from "@/components/Loader";
import ImageViewer from "./ImageViewer";
import { BusinessContext } from "@/context/BusinessContext";
import { formatCurrency } from "@/utils/formatting";

const PAGE_SIZE = 20;
const SORT_FIELDS = [
  { value: "createdAt", label: "Created Date" },
  { value: "tagId", label: "Tag ID" },
  { value: "name", label: "Name" },
  { value: "species", label: "Species" },
  { value: "status", label: "Status" },
  { value: "currentWeight", label: "Weight" },
  { value: "purchaseCost", label: "Purchase Cost" },
  { value: "projectedSalesPrice", label: "Projected Sales" },
];

export default function AnimalsList({
  searchTerm = "",
  filterStatus = "all",
  refreshKey = 0,
}) {
  const { businessSettings } = useContext(BusinessContext);
  const [animals, setAnimals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cursorStack, setCursorStack] = useState([null]);
  const [pageIndex, setPageIndex] = useState(0);
  const [nextCursor, setNextCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(null);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortDir, setSortDir] = useState("desc");
  const [editingId, setEditingId] = useState(null);
  const [editableAnimal, setEditableAnimal] = useState({});
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [modalAnimal, setModalAnimal] = useState(null);
  const [modalImages, setModalImages] = useState([]);
  const [uploadingImages, setUploadingImages] = useState(false);

  const currentCursor = cursorStack[pageIndex] || null;

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch {
        setUser(null);
      }
    }
  }, []);

  useEffect(() => {
    setCursorStack([null]);
    setPageIndex(0);
  }, [searchTerm, filterStatus, sortBy, sortDir, refreshKey]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAnimals();
    }, 250);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageIndex, currentCursor, searchTerm, filterStatus, sortBy, sortDir, refreshKey]);

  const fetchAnimals = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams({
        compact: "true",
        cursorPaginate: "true",
        limit: String(PAGE_SIZE),
        status: filterStatus || "all",
        sortBy,
        sortDir,
      });
      if (searchTerm?.trim()) params.set("q", searchTerm.trim());
      if (currentCursor) params.set("cursor", currentCursor);
      if (pageIndex === 0) params.set("includeTotal", "true");

      const res = await fetch(`/api/animals?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load animals");
      const data = await res.json();
      const items = Array.isArray(data.items) ? data.items : [];

      if (items.length === 0 && pageIndex > 0) {
        setPageIndex((p) => Math.max(0, p - 1));
        return;
      }

      setAnimals(items);
      setNextCursor(data.nextCursor || null);
      setHasMore(Boolean(data.hasMore));
      if (typeof data.total === "number") setTotal(data.total);
    } catch (err) {
      setError(err.message || "Failed to load animals");
      setAnimals([]);
      setNextCursor(null);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  const canDelete = useMemo(() => user?.role === "SuperAdmin", [user]);
  const canSeePricing = useMemo(() => ["SuperAdmin", "Manager"].includes(user?.role), [user]);
  const actionBtnClass = "px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors";

  const handleEditClick = (animal) => {
    setEditingId(animal._id);
    setEditableAnimal({ ...animal });
    setError("");
  };

  const handleCancelClick = () => {
    setEditingId(null);
    setEditableAnimal({});
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditableAnimal((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdateClick = async (id) => {
    try {
      setSaving(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/animals/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editableAnimal),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update animal");
      }
      setEditingId(null);
      setEditableAnimal({});
      fetchAnimals();
    } catch (err) {
      setError(err.message || "Failed to update animal");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = async (id) => {
    if (!window.confirm("Archive this animal?")) return;
    try {
      setSaving(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/animals/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to archive animal");
      }
      fetchAnimals();
    } catch (err) {
      setError(err.message || "Failed to archive animal");
    } finally {
      setSaving(false);
    }
  };

  const handleImageClick = async (animal) => {
    setModalAnimal(animal);
    setModalImages(animal.images || []);
    setImageModalOpen(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/animals/${animal._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const fullAnimal = await res.json();
      setModalAnimal(fullAnimal);
      setModalImages(fullAnimal.images || []);
    } catch {
      // fallback to compact data
    }
  };

  const handleDeleteImage = async (animalId, imageIndex) => {
    if (!modalAnimal) return;
    try {
      const token = localStorage.getItem("token");
      const updatedImages = (modalAnimal.images || []).filter((_, idx) => idx !== imageIndex);
      const res = await fetch(`/api/animals/${animalId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...modalAnimal, images: updatedImages }),
      });
      if (!res.ok) throw new Error("Failed to delete image");
      setModalAnimal((prev) => ({ ...prev, images: updatedImages }));
      setModalImages(updatedImages);
      fetchAnimals();
    } catch (err) {
      setError(err.message || "Failed to delete image");
    }
  };

  const handleAddImage = async (animalId, e) => {
    try {
      const files = e.target.files;
      if (!files || files.length === 0) return;
      setUploadingImages(true);
      const formData = new FormData();
      Array.from(files).forEach((file) => formData.append("file", file));

      const token = localStorage.getItem("token");
      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!uploadRes.ok) throw new Error("Failed to upload images");
      const uploadData = await uploadRes.json();
      const newImages = uploadData.links || [];
      const updatedImages = [...(modalAnimal?.images || []), ...newImages];

      const updateRes = await fetch(`/api/animals/${animalId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...modalAnimal, images: updatedImages }),
      });
      if (!updateRes.ok) throw new Error("Failed to save images");
      setModalAnimal((prev) => ({ ...prev, images: updatedImages }));
      setModalImages(updatedImages);
      fetchAnimals();
      e.target.value = "";
    } catch (err) {
      setError(err.message || "Failed to add image");
    } finally {
      setUploadingImages(false);
    }
  };

  const handleNextPage = () => {
    if (!hasMore || !nextCursor) return;
    setCursorStack((prev) => {
      const next = prev.slice(0, pageIndex + 1);
      next[pageIndex + 1] = nextCursor;
      return next;
    });
    setPageIndex((p) => p + 1);
  };

  const handlePrevPage = () => {
    if (pageIndex <= 0) return;
    setPageIndex((p) => Math.max(0, p - 1));
  };

  if (loading) return <Loader message="Loading animals..." color="blue-600" />;

  return (
    <div className="space-y-4">
      {error && <div className="error-message">{error}</div>}

      <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
        <div className="text-sm text-gray-600">
          Cursor page {pageIndex + 1}{typeof total === "number" ? ` (${total} total)` : ""}
        </div>
        <div className="flex gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            {SORT_FIELDS.map((field) => (
              <option key={field.value} value={field.value}>
                Sort: {field.label}
              </option>
            ))}
          </select>
          <select
            value={sortDir}
            onChange={(e) => setSortDir(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="desc">Desc</option>
            <option value="asc">Asc</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        {animals.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
            <p className="text-gray-700 font-semibold">No animals found</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gradient-to-r from-green-600 to-green-700">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-bold text-white">Actions</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-white">Photo</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-white">Tag ID</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-white">Name</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-white">Species</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-white">Status</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-white">Weight</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-white">Cost</th>
                {canSeePricing && <th className="px-4 py-3 text-right text-xs font-bold text-white">Projected Sales</th>}
              </tr>
            </thead>
            <tbody>
              {animals.map((animal) => {
                const isEditing = editingId === animal._id;
                return (
                  <tr key={animal._id} className={`${isEditing ? 'bg-amber-50' : idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} border-b border-gray-100 hover:bg-green-50 transition-colors`}>
                    <td className="px-3 py-3">
                      <div className="flex gap-1.5 flex-wrap">
                        {isEditing ? (
                          <>
                            <button onClick={() => handleUpdateClick(animal._id)} disabled={saving} className={`${actionBtnClass} border-green-200 bg-green-50 text-green-700 hover:bg-green-100`}>Save</button>
                            <button onClick={handleCancelClick} disabled={saving} className={`${actionBtnClass} border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100`}>Cancel</button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => handleEditClick(animal)} className={`${actionBtnClass} border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100`}>Edit</button>
                            <Link href={`/manage/animals/${animal._id}`} className={`${actionBtnClass} border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 inline-flex items-center`}>Details</Link>
                            {canDelete && <button onClick={() => handleDeleteClick(animal._id)} disabled={saving} className={`${actionBtnClass} border-red-200 bg-red-50 text-red-700 hover:bg-red-100`}>Delete</button>}
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div
                        className="flex items-center gap-1 cursor-pointer"
                        onClick={() => handleImageClick(animal)}
                        title="Click to view images"
                      >
                        <img
                          src={animal.images?.[0]?.thumb || animal.images?.[0]?.full || "/Image1.png"}
                          alt="Animal image 1"
                          className="w-10 h-10 object-cover rounded-lg border"
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold">
                      {isEditing ? (
                        <input type="text" name="tagId" value={editableAnimal.tagId || ""} onChange={handleChange} className="border px-2 py-1 rounded w-24 text-xs" />
                      ) : animal.tagId}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {isEditing ? (
                        <input type="text" name="name" value={editableAnimal.name || ""} onChange={handleChange} className="border px-2 py-1 rounded w-28 text-xs" />
                      ) : animal.name || "—"}
                    </td>
                    <td className="px-4 py-3 text-xs">{animal.species || "—"}</td>
                    <td className="px-4 py-3 text-xs">{animal.status || "—"}</td>
                    <td className="px-4 py-3 text-xs text-right">{animal.currentWeight ? `${animal.currentWeight} kg` : "—"}</td>
                    <td className="px-4 py-3 text-xs text-right">{animal.purchaseCost ? formatCurrency(animal.purchaseCost, businessSettings.currency) : "—"}</td>
                    {canSeePricing && <td className="px-4 py-3 text-xs text-right">{animal.projectedSalesPrice ? formatCurrency(animal.projectedSalesPrice, businessSettings.currency) : "—"}</td>}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-gray-200 pt-3">
        <p className="text-sm text-gray-600">Page {pageIndex + 1}</p>
        <div className="flex gap-2">
          <button onClick={handlePrevPage} disabled={pageIndex <= 0} className="px-3 py-1 border rounded disabled:opacity-40">‹ Prev</button>
          <button onClick={handleNextPage} disabled={!hasMore} className="px-3 py-1 border rounded disabled:opacity-40">Next ›</button>
        </div>
      </div>

      <Modal
        isOpen={imageModalOpen}
        onClose={() => setImageModalOpen(false)}
        title={modalAnimal ? `${modalAnimal.name || modalAnimal.tagId} - Image Gallery` : "Animal Image Gallery"}
        size="2xl"
      >
        <ImageViewer
          images={modalImages}
          animalName={modalAnimal?.name || modalAnimal?.tagId || "Animal"}
          animalInfo={modalAnimal}
          onDeleteImage={(imageIndex) => handleDeleteImage(modalAnimal._id, imageIndex)}
          onAddImage={(e) => handleAddImage(modalAnimal._id, e)}
          isUploading={uploadingImages}
        />
      </Modal>
    </div>
  );
}
