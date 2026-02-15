import { motion } from "framer-motion";
import { FaSearch, FaFilter, FaPlus, FaTimes } from "react-icons/fa";

/**
 * FilterBar Component
 * Provides consistent filtering UI for all list pages.
 *
 * Supports both legacy (single filter) and new (multiple filters) patterns:
 *
 * Legacy:
 *   <FilterBar filterOptions={[...]} filterValue={v} onFilterChange={fn} />
 *
 * New:
 *   <FilterBar filters={[
 *     { value, onChange, options: [{ value, label }] },
 *   ]} />
 */
export default function FilterBar({
  // Search
  searchPlaceholder,
  placeholder,
  searchTerm,
  onSearchChange,
  // Legacy single filter
  filterOptions = null,
  filterValue,
  onFilterChange,
  // New multi-filter array
  filters = null,
  // Action button
  showAddButton = false,
  onAddClick = null,
  isAddActive = false,
  addLabel = "Add New",
  additionalActions = null,
}) {
  const resolvedPlaceholder = searchPlaceholder || placeholder || "Search...";

  // Merge legacy single filter with new filters array
  const allFilters = [];
  if (filters && filters.length > 0) {
    allFilters.push(...filters);
  } else if (filterOptions) {
    allFilters.push({
      value: filterValue,
      onChange: onFilterChange,
      options: filterOptions,
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.1 }}
      className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 md:p-5"
    >
      <div className="flex flex-wrap items-center gap-3">
        {/* Search Input */}
        {onSearchChange && (
          <div className="relative flex-1 min-w-[200px]">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={resolvedPlaceholder}
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="input-field pl-10"
            />
          </div>
        )}

        {/* Filter Dropdowns */}
        {allFilters.map((filter, i) => (
          <div key={i} className="relative min-w-[150px]">
            <FaFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
            <select
              value={filter.value}
              onChange={(e) => filter.onChange(e.target.value)}
              className="input-field pl-9 appearance-none pr-8"
            >
              {filter.options?.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        ))}

        {/* Action Button */}
        {showAddButton && onAddClick && (
          <button
            onClick={onAddClick}
            className={`flex items-center justify-center gap-2 py-2 px-4 rounded-lg font-semibold transition-all ${
              isAddActive
                ? "bg-red-600 hover:bg-red-700 text-white"
                : "bg-green-600 hover:bg-green-700 text-white"
            }`}
          >
            {isAddActive ? (
              <>
                <FaTimes size={14} />
                Cancel
              </>
            ) : (
              <>
                <FaPlus size={14} />
                {addLabel}
              </>
            )}
          </button>
        )}
        {additionalActions}
      </div>
    </motion.div>
  );
}
