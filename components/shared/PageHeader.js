import { motion } from "framer-motion";
import AppIcon from "@/components/shared/AppIcon";

/**
 * PageHeader Component
 * Provides consistent header styling for all pages
 * Supports an optional `actions` prop for action buttons (e.g., Add/Cancel)
 *
 * `icon` is the name of an icon from the app's icon set (see AppIcon), e.g.
 * icon="animals". Use the same name as the page's entry in the sidebar so the
 * two always match. An icon component or element is also accepted.
 */
export default function PageHeader({
  title,
  subtitle,
  gradient = "from-green-600 to-green-700",
  icon = null,
  actions = null,
}) {
  const isNamed = typeof icon === "string" || typeof icon === "function";

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`bg-gradient-to-r ${gradient} text-white p-6 md:p-8 rounded-2xl shadow-lg border-0`}
    >
      <div className="flex flex-wrap items-center gap-x-4 gap-y-4 md:gap-x-5">
        {icon && (
          <div className="hidden sm:flex w-14 h-14 md:w-16 md:h-16 flex-shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25">
            {isNamed ? <AppIcon name={icon} className="w-7 h-7 md:w-8 md:h-8" /> : icon}
          </div>
        )}
        <div className="flex-1 min-w-[12rem]">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight leading-tight break-words">{title}</h1>
          {subtitle && <p className="text-white/80 mt-1.5 text-sm md:text-lg">{subtitle}</p>}
        </div>
        {actions && <div className="flex-shrink-0">{actions}</div>}
      </div>
    </motion.div>
  );
}
