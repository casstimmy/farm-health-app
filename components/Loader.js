/**
 * Unified Loader Component System
 * Centralized loading spinner for all async operations
 * 
 * Features:
 * - Multiple display variants (card, fullPage, inline, overlay)
 * - Color themes matching Tailwind palette
 * - Customizable messages and sizes
 * - Smooth animations with Framer Motion
 * - Specialized loaders for buttons and tables
 * 
 * Usage:
 * <Loader message="Loading..." color="blue-600" />
 * <Loader message="Loading..." fullPage />
 * <OverlayLoader message="Saving..." />
 */

import { motion } from "framer-motion";

// Color theme definitions
const LOADER_COLORS = {
  "blue-600": { spinner: "border-blue-600", bg: "from-blue-50 to-blue-100", text: "text-blue-700" },
  "green-600": { spinner: "border-green-600", bg: "from-green-50 to-green-100", text: "text-green-700" },
  "red-600": { spinner: "border-red-600", bg: "from-red-50 to-red-100", text: "text-red-700" },
  "purple-600": { spinner: "border-purple-600", bg: "from-purple-50 to-purple-100", text: "text-purple-700" },
  "orange-600": { spinner: "border-orange-600", bg: "from-orange-50 to-orange-100", text: "text-orange-700" },
  "pink-600": { spinner: "border-pink-600", bg: "from-pink-50 to-pink-100", text: "text-pink-700" },
  "yellow-600": { spinner: "border-yellow-600", bg: "from-yellow-50 to-yellow-100", text: "text-yellow-700" },
  "teal-600": { spinner: "border-teal-600", bg: "from-teal-50 to-teal-100", text: "text-teal-700" },
};

const sizeConfig = {
  sm: { spinner: "h-6 w-6", text: "text-sm", padding: "py-4" },
  md: { spinner: "h-12 w-12", text: "text-base", padding: "py-16" },
  lg: { spinner: "h-16 w-16", text: "text-lg", padding: "py-20" }
};

/**
 * Main Loader Component
 * Flexible loader that adapts to different contexts
 */
export default function Loader({ 
  message = "Loading...", 
  color = "green-600", 
  size = "md",
  fullPage = false,
  inline = false,
  overlay = false
}) {
  const colorTheme = LOADER_COLORS[color] || LOADER_COLORS["green-600"];
  const sizeClass = sizeConfig[size];

  const spinnerContent = (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="inline-block text-center"
    >
      <div className={`animate-spin rounded-full ${sizeClass.spinner} border-4 ${colorTheme.spinner} mx-auto`}></div>
      {message && (
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className={`${sizeClass.text} text-gray-600 mt-4 font-medium`}
        >
          {message}
        </motion.p>
      )}
    </motion.div>
  );

  // Overlay loader (for modals/forms)
  if (overlay) {
    return (
      <div className="absolute inset-0 bg-white bg-opacity-75 rounded-2xl flex items-center justify-center z-10">
        {spinnerContent}
      </div>
    );
  }

  // Inline loader (no background)
  if (inline) {
    return (
      <div className={`text-center ${sizeClass.padding}`}>
        {spinnerContent}
      </div>
    );
  }

  // Full page loader
  if (fullPage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-gray-50 to-gray-100">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="text-center py-16 bg-white rounded-2xl shadow-2xl px-16 border border-gray-100"
        >
          {spinnerContent}
        </motion.div>
      </div>
    );
  }

  // Default card loader
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="text-center bg-white rounded-2xl shadow-lg border border-gray-100"
      style={{ padding: sizeClass.padding }}
    >
      {spinnerContent}
    </motion.div>
  );
}

/**
 * Overlay Loader - For modal/form overlays
 * Used when saving/submitting forms in modals
 */
export function OverlayLoader({ message = "Processing...", color = "blue-600" }) {
  return <Loader message={message} color={color} overlay />;
}

/**
 * Button Loader - Compact spinner for buttons
 * Used inside buttons during loading states
 */
export function ButtonLoader({ color = "currentColor", size = "sm" }) {
  const colorTheme = LOADER_COLORS[color] || { spinner: "border-current" };
  const sizeClass = sizeConfig[size];
  
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      className={`inline-block rounded-full border-2 ${colorTheme.spinner} ${sizeClass.spinner}`}
    />
  );
}

/**
 * Skeleton Loader - For table/list rows
 * Shows placeholder skeleton while data loads
 */
export function SkeletonLoader({ columns = 5, rows = 3, variant = "table" }) {
  if (variant === "table") {
    return (
      <div className="animate-pulse space-y-2">
        {[...Array(rows)].map((_, rowIdx) => (
          <div key={rowIdx} className="flex gap-4 py-4 border-b border-gray-100">
            {[...Array(columns)].map((_, colIdx) => (
              <div 
                key={colIdx} 
                className="flex-1 h-4 bg-gradient-to-r from-gray-200 to-gray-100 rounded"
              />
            ))}
          </div>
        ))}
      </div>
    );
  }

  if (variant === "cards") {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
        {[...Array(rows)].map((_, idx) => (
          <div key={idx} className="bg-gray-200 rounded-2xl h-40" />
        ))}
      </div>
    );
  }

  return null;
}

/**
 * Shimmer Effect Loader - Modern shimmer animation
 * Used for premium-looking loading states
 */
export function ShimmerLoader({ message = "Loading...", height = "h-4" }) {
  return (
    <motion.div className="space-y-4">
      <div className={`${height} bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-lg animate-pulse`} />
      <div className={`${height} bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-lg animate-pulse w-5/6`} />
      {message && (
        <p className="text-sm text-gray-500 mt-4">{message}</p>
      )}
    </motion.div>
  );
}

/**
 * Progress Loader - For operations with progress indication
 * Shows progress percentage during longer operations
 */
export function ProgressLoader({ 
  message = "Processing...", 
  progress = 0, 
  color = "blue-600",
  showPercentage = true 
}) {
  const colorTheme = LOADER_COLORS[color] || LOADER_COLORS["blue-600"];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full max-w-sm mx-auto text-center py-8"
    >
      <div className="mb-4">
        <p className="text-gray-700 font-semibold mb-2">{message}</p>
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(progress, 100)}%` }}
            transition={{ duration: 0.5 }}
            className={`h-full bg-gradient-to-r ${colorTheme.bg}`}
          />
        </div>
        {showPercentage && (
          <p className="text-sm text-gray-500 mt-2">{Math.round(progress)}%</p>
        )}
      </div>
    </motion.div>
  );
}

// Legacy export for backward compatibility
export const TableLoader = SkeletonLoader;
