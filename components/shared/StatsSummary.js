import { motion } from "framer-motion";
import AppIcon from "@/components/shared/AppIcon";

/**
 * StatsSummary Component
 * Displays summary cards in a grid layout with consistent styling
 *
 * Each stat may carry `icon`: the name of an icon from the app's icon set
 * (see AppIcon). It is drawn in the card's own accent colour.
 */
// Column layout per number of cards (class names are written out in full so
// Tailwind picks them up). Chosen so no card is ever left alone on a row.
const GRID_BY_COUNT = {
  1: "grid-cols-1",
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4",
  5: "grid-cols-2 md:grid-cols-3 xl:grid-cols-5",
  6: "grid-cols-2 md:grid-cols-3 2xl:grid-cols-6",
};
const GRID_DEFAULT = "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";

export default function StatsSummary({ stats = [], activeFilter }) {
  const grid = GRID_BY_COUNT[stats.length] || GRID_DEFAULT;
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ staggerChildren: 0.1, delayChildren: 0.2 }}
      className={`grid ${grid} gap-4 md:gap-6`}
    >
      {stats.map((stat, idx) => {
        const isClickable = !!stat.onClick;
        const isActive = activeFilter !== undefined && stat.filterKey !== undefined && activeFilter === stat.filterKey;
        const isNamedIcon = typeof stat.icon === "string" || typeof stat.icon === "function";
        return (
        <motion.div
          key={idx}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.05 }}
          onClick={stat.onClick || undefined}
          className={`${stat.bgColor || "bg-white"} rounded-2xl shadow-lg border-2 ${
            isActive ? "ring-2 ring-offset-1 ring-violet-500 border-violet-400" : (stat.borderColor || "border-gray-100")
          } p-5 md:p-6 hover:shadow-xl transition-all ${isClickable ? "cursor-pointer active:scale-[0.98]" : ""}`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide break-words">
                {stat.label}
              </p>
              <p className={`${stat.isText ? "text-lg truncate" : "text-3xl"} font-black mt-3 ${stat.textColor || "text-gray-900"}`}>
                {stat.value}
              </p>
              {stat.subtitle && (
                <p className="text-xs text-gray-500 mt-2">{stat.subtitle}</p>
              )}
            </div>
            {stat.icon && (
              <span
                className={`hidden sm:flex w-11 h-11 flex-shrink-0 items-center justify-center rounded-xl bg-white/70 border border-black/5 ${stat.textColor || "text-gray-700"}`}
              >
                {isNamedIcon ? <AppIcon name={stat.icon} className="w-5 h-5" /> : stat.icon}
              </span>
            )}
          </div>
        </motion.div>
        );
      })}
    </motion.div>
  );
}
