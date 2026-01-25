/**
 * Auth Layout Component
 * 
 * Modern layout for unauthenticated pages (login, register, etc.)
 * - Full-screen responsive design
 * - Hero section on desktop
 * - Framer Motion animations
 * - Mobile-optimized
 * 
 * Usage:
 * <AuthLayout heroContent={<HeroSection />}>
 *   <LoginForm />
 * </AuthLayout>
 */
import { motion } from 'framer-motion';

export default function AuthLayout({ 
  children, 
  heroContent = null,
  title = "Farm Health System"
}) {
  return (
    <div className="min-h-screen w-screen bg-gradient-to-br from-green-50 via-emerald-50 to-cyan-50 flex items-center justify-center overflow-hidden">
      {/* Full Screen Container */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full flex items-center justify-center"
        style={{ minHeight: "100vh" }}
      >
        {/* Left Section - Hero (Hidden on Mobile) */}
        {heroContent && (
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="hidden lg:flex flex-col justify-center w-1/2 px-12"
          >
            {heroContent}
          </motion.div>
        )}

        {/* Right Section - Main Content (Centered on Mobile) */}
        <motion.div
          initial={{ opacity: 0, x: heroContent ? 50 : 0 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className={`${
            heroContent 
              ? "w-full lg:w-1/2 flex items-center justify-center px-4" 
              : "w-full flex items-center justify-center px-4"
          }`}
        >
          <div className="">
            {title && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-center mb-8"
              >
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {title}
                </h1>
              </motion.div>
            )}

            {/* Content */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              {children}
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
