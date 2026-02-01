import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaChevronLeft, FaChevronRight, FaTimes, FaTrash, FaImage, FaPlus } from "react-icons/fa";

/**
 * Advanced Image Viewer Component
 * Features:
 * - Main image display
 * - Thumbnail navigation at the bottom
 * - Smooth transitions between images
 * - Delete image capability
 * - Upload new images
 * - Keyboard navigation support
 */
export default function ImageViewer({ 
  images = [], 
  animalName = "Animal",
  onDeleteImage = null,
  onAddImage = null
}) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [localImages, setLocalImages] = useState(images);
  const fileInputRef = useRef(null);

  useEffect(() => {
    setLocalImages(images);
    setSelectedIndex(0);
  }, [images]);

  if (!localImages || localImages.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg space-y-4">
        <FaImage className="mx-auto text-4xl text-gray-400" />
        <p className="text-gray-500">No images available</p>
        {onAddImage && (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition-all"
          >
            Add First Image
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={onAddImage}
          className="hidden"
        />
      </div>
    );
  }

  const currentImage = localImages[selectedIndex];
  const imageUrl = currentImage?.full || currentImage?.thumb || currentImage;

  const handlePrevious = () => {
    setSelectedIndex((prev) => (prev === 0 ? localImages.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setSelectedIndex((prev) => (prev === localImages.length - 1 ? 0 : prev + 1));
  };

  const handleDeleteImage = async () => {
    if (confirm(`Delete image ${selectedIndex + 1}?`)) {
      if (onDeleteImage) {
        await onDeleteImage(selectedIndex);
      }
      const newImages = localImages.filter((_, idx) => idx !== selectedIndex);
      setLocalImages(newImages);
      if (selectedIndex >= newImages.length && selectedIndex > 0) {
        setSelectedIndex(selectedIndex - 1);
      }
    }
  };

  const handleAddImage = (e) => {
    if (onAddImage) {
      onAddImage(e);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "ArrowLeft") handlePrevious();
    if (e.key === "ArrowRight") handleNext();
    if (e.key === "Delete") handleDeleteImage();
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [localImages, selectedIndex]);

  return (
    <div className="w-full space-y-4">
      {/* Main Image Display */}
      <div className="relative bg-black rounded-xl overflow-hidden">
        <motion.div
          key={selectedIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="relative aspect-video flex items-center justify-center"
        >
          <img
            src={imageUrl}
            alt={`${animalName} - Image ${selectedIndex + 1}`}
            className="w-full h-full object-contain"
          />
        </motion.div>

        {/* Image Counter */}
        <div className="absolute top-4 right-4 bg-black bg-opacity-70 text-white px-3 py-1 rounded-full text-sm font-semibold">
          {selectedIndex + 1} / {localImages.length}
        </div>

        {/* Navigation Buttons */}
        {localImages.length > 1 && (
          <>
            <button
              onClick={handlePrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 text-black p-3 rounded-full transition-all shadow-lg z-10"
              title="Previous image (← Arrow)"
            >
              <FaChevronLeft size={20} />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 text-black p-3 rounded-full transition-all shadow-lg z-10"
              title="Next image (→ Arrow)"
            >
              <FaChevronRight size={20} />
            </button>
          </>
        )}

        {/* Action Buttons */}
        <div className="absolute bottom-4 left-4 right-4 flex gap-2 justify-between flex-wrap">
          <div className="flex gap-2">
            {onAddImage && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg font-semibold flex items-center gap-2 transition-all shadow-lg"
                title="Add new image"
              >
                <FaPlus size={16} />
                <span className="hidden sm:inline">Add</span>
              </button>
            )}
            <button
              onClick={handleDeleteImage}
              className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg font-semibold flex items-center gap-2 transition-all shadow-lg"
              title="Delete image (Delete key)"
            >
              <FaTrash size={16} />
              <span className="hidden sm:inline">Delete</span>
            </button>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleAddImage}
          className="hidden"
        />
      </div>

      {/* Thumbnail Navigation */}
      {localImages.length > 1 && (
        <div className="bg-gray-100 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-3 font-semibold">Select Image</p>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {localImages.map((img, idx) => {
              const thumbUrl = img?.thumb || img?.full || img;
              return (
                <motion.button
                  key={idx}
                  onClick={() => setSelectedIndex(idx)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`flex-shrink-0 relative rounded-lg overflow-hidden border-2 transition-all ${
                    selectedIndex === idx
                      ? "border-blue-600 ring-2 ring-blue-400"
                      : "border-gray-300 hover:border-blue-400"
                  }`}
                >
                  <img
                    src={thumbUrl}
                    alt={`Thumbnail ${idx + 1}`}
                    className="w-20 h-20 object-cover"
                  />
                  {selectedIndex === idx && (
                    <div className="absolute inset-0 bg-blue-500 bg-opacity-20" />
                  )}
                </motion.button>
              );
            })}
          </div>
          <p className="text-xs text-gray-500 mt-2">← → keys to navigate</p>
        </div>
      )}
    </div>
  );
}
