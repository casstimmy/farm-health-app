import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaChevronLeft, FaChevronRight, FaTimes, FaDownload } from "react-icons/fa";

/**
 * Advanced Image Viewer Component
 * Features:
 * - Main image display with zoom capabilities
 * - Thumbnail navigation at the bottom
 * - Smooth transitions between images
 * - Download capability
 * - Keyboard navigation support
 */
export default function ImageViewer({ images = [], animalName = "Animal" }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (!images || images.length === 0) {
    return (
      <div className="text-center py-8 bg-gray-50 rounded-lg">
        <p className="text-gray-500">No images available</p>
      </div>
    );
  }

  const currentImage = images[selectedIndex];
  const imageUrl = currentImage?.full || currentImage?.thumb || currentImage;

  const handlePrevious = () => {
    setSelectedIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setSelectedIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handleKeyDown = (e) => {
    if (e.key === "ArrowLeft") handlePrevious();
    if (e.key === "ArrowRight") handleNext();
    if (e.key === "Escape") setIsFullscreen(false);
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleDownload = async () => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${animalName}-${selectedIndex + 1}.jpg`;
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

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
            onClick={() => setIsFullscreen(true)}
          />
        </motion.div>

        {/* Image Counter */}
        <div className="absolute top-4 right-4 bg-black bg-opacity-70 text-white px-3 py-1 rounded-full text-sm font-semibold">
          {selectedIndex + 1} / {images.length}
        </div>

        {/* Navigation Buttons */}
        {images.length > 1 && (
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
        <div className="absolute bottom-4 left-4 right-4 flex gap-2 justify-between">
          <button
            onClick={handleDownload}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-all shadow-lg"
            title="Download image"
          >
            <FaDownload size={16} />
            <span className="hidden sm:inline">Download</span>
          </button>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded-lg font-semibold transition-all shadow-lg"
            title="Toggle fullscreen (Esc to exit)"
          >
            {isFullscreen ? "Exit" : "Fullscreen"}
          </button>
        </div>
      </div>

      {/* Thumbnail Navigation */}
      {images.length > 1 && (
        <div className="bg-gray-100 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-3 font-semibold">Select Image</p>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {images.map((img, idx) => {
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
        </div>
      )}

      {/* Fullscreen Modal */}
      <AnimatePresence>
        {isFullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-50 flex items-center justify-center p-4"
            onClick={() => setIsFullscreen(false)}
          >
            <div className="relative w-full h-full flex items-center justify-center">
              <img
                src={imageUrl}
                alt={`${animalName} - Fullscreen`}
                className="w-full h-full object-contain"
                onClick={(e) => e.stopPropagation()}
              />

              {/* Fullscreen Navigation */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePrevious();
                    }}
                    className="absolute left-6 top-1/2 -translate-y-1/2 bg-white bg-opacity-90 hover:bg-opacity-100 text-black p-4 rounded-full transition-all shadow-2xl"
                  >
                    <FaChevronLeft size={28} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNext();
                    }}
                    className="absolute right-6 top-1/2 -translate-y-1/2 bg-white bg-opacity-90 hover:bg-opacity-100 text-black p-4 rounded-full transition-all shadow-2xl"
                  >
                    <FaChevronRight size={28} />
                  </button>
                </>
              )}

              {/* Fullscreen Close Button */}
              <button
                onClick={() => setIsFullscreen(false)}
                className="absolute top-6 right-6 bg-white bg-opacity-90 hover:bg-opacity-100 text-black p-4 rounded-full transition-all shadow-2xl"
                title="Close fullscreen (Esc)"
              >
                <FaTimes size={24} />
              </button>

              {/* Image Counter in Fullscreen */}
              <div className="absolute bottom-6 left-6 bg-black bg-opacity-70 text-white px-4 py-2 rounded-full text-sm font-semibold">
                {selectedIndex + 1} / {images.length}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
