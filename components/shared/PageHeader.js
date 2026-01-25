import { motion } from "framer-motion";

/**
 * PageHeader Component
 * Provides consistent header styling for all pages
 */
export default function PageHeader({
  title,
  subtitle,
  gradient = "from-green-600 to-green-700",
  icon = null,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`bg-gradient-to-r ${gradient} text-white p-8 rounded-2xl shadow-lg border-0`}
    >
      <div className="flex items-center gap-4">
        {icon && <span className="text-4xl">{icon}</span>}
        <div className="flex-1">
          <h1 className="text-3xl md:text-4xl font-black tracking-tight">{title}</h1>
          {subtitle && <p className="text-white/80 mt-2 text-base md:text-lg">{subtitle}</p>}
        </div>
      </div>
    </motion.div>
  );
}
