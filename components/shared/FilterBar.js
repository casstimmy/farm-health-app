import { motion } from "framer-motion";
import { FaSearch, FaFilter, FaPlus, FaTimes } from "react-icons/fa";

/**
 * FilterBar Component
 * Provides consistent filtering UI for all list pages
 */
export default function FilterBar({
  searchPlaceholder = "Search...",
  searchTerm,
  onSearchChange,
  filterOptions = null,
  filterValue,
  onFilterChange,
  showAddButton = false,
  onAddClick = null,
  isAddActive = false,
  additionalActions = null,
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.1 }}
      className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Search Input */}
        <div className="relative">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="input-field pl-10"
          />
        </div>

        {/* Filter Dropdown */}
        {filterOptions && (
          <div className="relative">
            <FaFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              value={filterValue}
              onChange={(e) => onFilterChange(e.target.value)}
              className="input-field pl-10 appearance-none"
            >
              {filterOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Action Button */}
        <div className="flex gap-2">
          {showAddButton && onAddClick && (
            <button
              onClick={onAddClick}
              className={`flex items-center justify-center gap-2 py-2 px-4 rounded-lg font-semibold transition-all flex-1 ${
                isAddActive
                  ? "bg-red-600 hover:bg-red-700 text-white"
                  : "bg-green-600 hover:bg-green-700 text-white"
              }`}
            >
              {isAddActive ? (
                <>
                  <FaTimes size={18} />
                  Cancel
                </>
              ) : (
                <>
                  <FaPlus size={18} />
                  Add New
                </>
              )}
            </button>
          )}
          {additionalActions}
        </div>
      </div>
    </motion.div>
  );
}
