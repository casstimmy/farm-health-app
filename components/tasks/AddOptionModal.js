"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaPlus, FaTimes, FaCheck } from "react-icons/fa";
import { addDropdownOption } from "@/lib/dropdownOptions";

/**
 * AddOptionModal Component
 * Allows users to add new custom options to dropdown fields
 * 
 * Props:
 *   fieldType: string - Type of field (taskGroups, frequencies, categories, etc)
 *   fieldLabel: string - Display name of the field
 *   isOpen: boolean - Control modal visibility
 *   onClose: function - Callback to close modal
 *   onOptionAdded: function - Callback when option is successfully added
 */
export default function AddOptionModal({
  fieldType,
  fieldLabel,
  isOpen,
  onClose,
  onOptionAdded,
}) {
  const [inputValue, setInputValue] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddOption = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!inputValue.trim()) {
      setError("Please enter a valid option");
      return;
    }

    if (inputValue.trim().length < 2) {
      setError("Option must be at least 2 characters");
      return;
    }

    if (inputValue.trim().length > 50) {
      setError("Option cannot exceed 50 characters");
      return;
    }

    setIsSubmitting(true);

    try {
      const added = addDropdownOption(fieldType, inputValue.trim());

      if (!added) {
        setError("This option already exists or cannot be added");
        setIsSubmitting(false);
        return;
      }

      setSuccess(`"${inputValue.trim()}" added to ${fieldLabel} options!`);
      setInputValue("");

      // Notify parent component
      if (onOptionAdded) {
        onOptionAdded(inputValue.trim());
      }

      // Close after success
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      setError(err.message || "Failed to add option");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-xl border border-gray-200 shadow-lg w-full max-w-md overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-violet-600 to-purple-700 px-6 py-4 flex items-center justify-between">
              <h3 className="text-white font-bold flex items-center gap-2">
                <FaPlus size={14} /> Add New {fieldLabel}
              </h3>
              <button
                onClick={onClose}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <FaTimes size={18} />
              </button>
            </div>

            {/* Content */}
            <form onSubmit={handleAddOption} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {fieldLabel} Name
                </label>
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => {
                    setInputValue(e.target.value);
                    setError("");
                  }}
                  placeholder={`Enter new ${fieldLabel.toLowerCase()}`}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:border-violet-400 transition-colors"
                  disabled={isSubmitting}
                  autoFocus
                />
              </div>

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2"
                >
                  <span>⚠️</span> {error}
                </motion.div>
              )}

              {/* Success Message */}
              {success && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex items-center gap-2"
                >
                  <FaCheck size={14} /> {success}
                </motion.div>
              )}

              {/* Buttons */}
              <div className="flex gap-2 pt-2 border-t border-gray-200">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-semibold text-sm hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !inputValue.trim()}
                  className="flex-1 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <span className="animate-spin">⚙️</span> Adding...
                    </>
                  ) : (
                    <>
                      <FaCheck size={12} /> Add {fieldLabel}
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
