import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { FaChevronLeft, FaChevronRight, FaTrash, FaPlus } from "react-icons/fa";
import Loader from "../Loader";

export default function ImageViewer({
  images = [],
  animalName = "Animal",
  animalInfo = null,
  onDeleteImage = null,
  onAddImage = null,
  isUploading = false,
}) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const fileInputRef = useRef(null);

  const sourceImages = Array.isArray(images) ? images : [];
  const usingPlaceholders = sourceImages.length === 0;
  const normalizedImages = usingPlaceholders
    ? [
        { full: "/Image1.png", thumb: "/Image1.png", isPlaceholder: true, label: "Image 1 placeholder" },
        { full: "/Image2.png", thumb: "/Image2.png", isPlaceholder: true, label: "Image 2 placeholder" },
      ]
    : sourceImages;
  const hasImages = normalizedImages.length > 0;
  const safeSelectedIndex = hasImages ? Math.min(selectedIndex, normalizedImages.length - 1) : 0;

  const currentImage = normalizedImages[safeSelectedIndex];
  const imageUrl = currentImage?.full || currentImage?.thumb || currentImage;

  const handlePrevious = () => {
    setSelectedIndex((prev) => (prev === 0 ? normalizedImages.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setSelectedIndex((prev) => (prev === normalizedImages.length - 1 ? 0 : prev + 1));
  };

  const handleDeleteImage = async () => {
    if (usingPlaceholders) return;
    if (confirm(`Delete image ${safeSelectedIndex + 1}?`)) {
      if (onDeleteImage) {
        await onDeleteImage(safeSelectedIndex);
      }
      if (safeSelectedIndex === normalizedImages.length - 1 && safeSelectedIndex > 0) {
        setSelectedIndex(safeSelectedIndex - 1);
      }
    }
  };

  const handleAddImage = (e) => {
    e.stopPropagation();
    if (onAddImage) onAddImage(e);
  };

  return (
    <div className="w-full space-y-4">
      {animalInfo && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-bold text-blue-900 mb-2">Animal Basic Info</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            <p><span className="font-semibold text-gray-700">Tag ID:</span> {animalInfo.tagId || "-"}</p>
            <p><span className="font-semibold text-gray-700">Animal Name:</span> {animalInfo.name || "-"}</p>
            <p><span className="font-semibold text-gray-700">Species:</span> {animalInfo.species || "-"}</p>
            <p><span className="font-semibold text-gray-700">Breed:</span> {animalInfo.breed || "-"}</p>
            <p><span className="font-semibold text-gray-700">Gender:</span> {animalInfo.gender || "-"}</p>
            <p><span className="font-semibold text-gray-700">Class:</span> {animalInfo.class || "-"}</p>
            <p><span className="font-semibold text-gray-700">Date of Birth:</span> {animalInfo.dob ? new Date(animalInfo.dob).toLocaleDateString() : "-"}</p>
          </div>
        </div>
      )}

      <div className="relative bg-black rounded-xl overflow-hidden">
        {isUploading && <Loader variant="overlay" />}
        <motion.div
          key={safeSelectedIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="relative aspect-video flex items-center justify-center"
        >
          <img
            src={imageUrl}
            alt={`${animalName} - Image ${safeSelectedIndex + 1}`}
            className="w-full h-full object-contain"
          />
        </motion.div>

        <div className="absolute top-4 right-4 bg-black bg-opacity-70 text-white px-3 py-1 rounded-full text-sm font-semibold">
          {safeSelectedIndex + 1} / {normalizedImages.length}
        </div>

        {normalizedImages.length > 1 && (
          <>
            <button
              onClick={handlePrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 text-black p-3 rounded-full transition-all shadow-lg z-10"
              title="Previous image (Left Arrow)"
            >
              <FaChevronLeft size={20} />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 text-black p-3 rounded-full transition-all shadow-lg z-10"
              title="Next image (Right Arrow)"
            >
              <FaChevronRight size={20} />
            </button>
          </>
        )}

        <div className="absolute bottom-4 left-4 right-4 flex gap-2 justify-between flex-wrap">
          <div className="flex gap-2">
            {onAddImage && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                disabled={isUploading}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-3 py-2 rounded-lg font-semibold flex items-center gap-2 transition-all shadow-lg"
                title={isUploading ? "Uploading..." : "Add new image"}
              >
                <FaPlus size={16} />
                <span className="hidden sm:inline">{isUploading ? "Uploading..." : "Add"}</span>
              </button>
            )}
            {!usingPlaceholders && (
              <button
                onClick={handleDeleteImage}
                disabled={isUploading}
                className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white px-3 py-2 rounded-lg font-semibold flex items-center gap-2 transition-all shadow-lg"
                title={isUploading ? "Uploading..." : "Delete image (Delete key)"}
              >
                <FaTrash size={16} />
                <span className="hidden sm:inline">Delete</span>
              </button>
            )}
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleAddImage}
          disabled={isUploading}
          className="hidden"
        />
      </div>

      {normalizedImages.length > 1 && (
        <div className="bg-gray-100 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-3 font-semibold">Select Image</p>
          <div
            className="flex gap-3 overflow-x-auto pb-2 scroll-smooth"
            ref={(el) => {
              if (el && safeSelectedIndex > 2) {
                const targetButton = el.querySelector(`[data-index="${safeSelectedIndex}"]`);
                if (targetButton) {
                  targetButton.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
                }
              }
            }}
          >
            {normalizedImages.map((img, idx) => {
              const thumbUrl = img?.thumb || img?.full || img;
              return (
                <motion.button
                  key={idx}
                  data-index={idx}
                  onClick={() => setSelectedIndex(idx)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`flex-shrink-0 relative rounded-lg overflow-hidden border-2 transition-all ${
                    safeSelectedIndex === idx
                      ? "border-blue-600 ring-2 ring-blue-400"
                      : "border-gray-300 hover:border-blue-400"
                  }`}
                >
                  <img
                    src={thumbUrl}
                    alt={`Thumbnail ${idx + 1}`}
                    className="w-20 h-20 object-cover"
                  />
                  {safeSelectedIndex === idx && (
                    <div className="absolute inset-0 bg-blue-200 bg-opacity-10" />
                  )}
                </motion.button>
              );
            })}
          </div>
          <p className="text-xs text-gray-500 mt-2">Use left/right arrow keys to navigate</p>
        </div>
      )}
    </div>
  );
}
