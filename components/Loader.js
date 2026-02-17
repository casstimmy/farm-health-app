/**
 * Unified Loader Component System
 * Centralized loading spinner for all async operations
 * 
 * Features:
 * - Auto-detects business logo from BusinessContext
 * - Simulated progress bar with percentage
 * - Multiple display variants (card, fullPage, inline, overlay)
 * - Color themes matching Tailwind palette
 * - Customizable messages and sizes
 * - Smooth animations with Framer Motion
 * 
 * Usage:
 * <Loader message="Loading..." color="blue-600" />
 * <Loader message="Loading..." fullPage />
 * <OverlayLoader message="Saving..." />
 */

import { useContext, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BusinessContext } from "@/context/BusinessContext";

// Color theme definitions
const LOADER_COLORS = {
  "blue-600": { spinner: "border-blue-600", bg: "from-blue-500 to-blue-600", text: "text-blue-700", track: "bg-blue-100" },
  "green-600": { spinner: "border-green-600", bg: "from-green-500 to-green-600", text: "text-green-700", track: "bg-green-100" },
  "red-600": { spinner: "border-red-600", bg: "from-red-500 to-red-600", text: "text-red-700", track: "bg-red-100" },
  "purple-600": { spinner: "border-purple-600", bg: "from-purple-500 to-purple-600", text: "text-purple-700", track: "bg-purple-100" },
  "orange-600": { spinner: "border-orange-600", bg: "from-orange-500 to-orange-600", text: "text-orange-700", track: "bg-orange-100" },
  "pink-600": { spinner: "border-pink-600", bg: "from-pink-500 to-pink-600", text: "text-pink-700", track: "bg-pink-100" },
  "yellow-600": { spinner: "border-yellow-600", bg: "from-yellow-500 to-yellow-600", text: "text-yellow-700", track: "bg-yellow-100" },
  "teal-600": { spinner: "border-teal-600", bg: "from-teal-500 to-teal-600", text: "text-teal-700", track: "bg-teal-100" },
};

const sizeConfig = {
  sm: { spinner: "h-6 w-6", logo: "h-8 w-8", text: "text-sm", padding: "py-4", bar: "h-1" },
  md: { spinner: "h-10 w-10", logo: "h-14 w-14", text: "text-base", padding: "py-16", bar: "h-1.5" },
  lg: { spinner: "h-14 w-14", logo: "h-20 w-20", text: "text-lg", padding: "py-20", bar: "h-2" }
};

/**
 * Hook for simulated progress (auto-increment to ~90%)
 */
function useSimulatedProgress() {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    let timeout;
    const tick = () => {
      setProgress((prev) => {
        if (prev >= 90) return prev;
        // Fast at first, then slow down
        const increment = prev < 30 ? 8 : prev < 60 ? 4 : prev < 80 ? 2 : 0.5;
        return Math.min(prev + increment, 92);
      });
      // Faster ticks initially, slower later
      const delay = progress < 30 ? 200 : progress < 60 ? 400 : 800;
      timeout = setTimeout(tick, delay);
    };
    timeout = setTimeout(tick, 100);
    return () => clearTimeout(timeout);
  }, []);
  return progress;
}

/**
 * Main Loader Component
 * Automatically shows business logo and progress bar
 */
export default function Loader({ 
  message = "Loading...", 
  color = "green-600", 
  size = "md",
  fullPage = false,
  inline = false,
  overlay = false,
  businessLogo = null,
  showProgress = true
}) {
  // Auto-detect business logo from context
  let contextLogo = null;
  try {
    const ctx = useContext(BusinessContext);
    contextLogo = ctx?.businessSettings?.businessLogo;
  } catch (e) {
    // Context may not be available
  }
  const logo = businessLogo || contextLogo;
  
  const colorTheme = LOADER_COLORS[color] || LOADER_COLORS["green-600"];
  const sizeClass = sizeConfig[size];
  const progress = useSimulatedProgress();

  const spinnerContent = (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="inline-block text-center w-full"
    >
      {logo && (
        <motion.img 
          src={logo} 
          alt="Logo"
          className={`${sizeClass.logo} mx-auto mb-3 object-contain rounded-lg`}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, type: "spring" }}
          onError={(e) => { e.target.style.display = "none"; }}
        />
      )}
      <div className={`animate-spin rounded-full ${sizeClass.spinner} border-4 border-gray-200 ${colorTheme.spinner} border-t-transparent mx-auto`}
        style={{ borderTopColor: "transparent" }}
      ></div>
      {message && (
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className={`${sizeClass.text} text-gray-600 mt-3 font-medium`}
        >
          {message}
        </motion.p>
      )}
      {showProgress && size !== "sm" && (
        <div className="mt-3 w-48 mx-auto">
          <div className={`w-full ${colorTheme.track} rounded-full ${sizeClass.bar} overflow-hidden`}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className={`h-full bg-gradient-to-r ${colorTheme.bg} rounded-full`}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">{Math.round(progress)}%</p>
        </div>
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
      className="text-center bg-white rounded-2xl shadow-lg border border-gray-100 py-16 px-8"
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
 * Progress Loader - For operations with known progress (e.g. seeding, importing)
 * Shows progress percentage with logo
 */
export function ProgressLoader({ 
  message = "Processing...", 
  progress = 0, 
  color = "blue-600",
  showPercentage = true,
  businessLogo = null
}) {
  let contextLogo = null;
  try {
    const ctx = useContext(BusinessContext);
    contextLogo = ctx?.businessSettings?.businessLogo;
  } catch (e) {}
  const logo = businessLogo || contextLogo;
  const colorTheme = LOADER_COLORS[color] || LOADER_COLORS["blue-600"];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full max-w-sm mx-auto text-center py-8"
    >
      {logo && (
        <motion.img 
          src={logo} 
          alt="Logo"
          className="h-14 w-14 mx-auto mb-4 object-contain rounded-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onError={(e) => { e.target.style.display = "none"; }}
        />
      )}
      <div className="mb-4">
        <p className="text-gray-700 font-semibold mb-2">{message}</p>
        <div className={`w-full ${colorTheme.track} rounded-full h-2 overflow-hidden`}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(progress, 100)}%` }}
            transition={{ duration: 0.5 }}
            className={`h-full bg-gradient-to-r ${colorTheme.bg} rounded-full`}
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
