import { motion } from "framer-motion";

/**
 * StatsSummary Component
 * Displays summary cards in a grid layout with consistent styling
 */
export default function StatsSummary({ stats = [] }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ staggerChildren: 0.1, delayChildren: 0.2 }}
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
    >
      {stats.map((stat, idx) => (
        <motion.div
          key={idx}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.05 }}
          className={`${stat.bgColor || "bg-white"} rounded-2xl shadow-lg border-2 ${
            stat.borderColor || "border-gray-100"
          } p-6 hover:shadow-xl transition-all`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                {stat.label}
              </p>
              <p className={`text-3xl font-black mt-3 ${stat.textColor || "text-gray-900"}`}>
                {stat.value}
              </p>
              {stat.subtitle && (
                <p className="text-xs text-gray-500 mt-2">{stat.subtitle}</p>
              )}
            </div>
            {stat.icon && (
              <span className="text-3xl ml-2">{stat.icon}</span>
            )}
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}
