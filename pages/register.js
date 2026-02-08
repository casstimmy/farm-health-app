import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { FaSpinner, FaCheckCircle, FaUser, FaEnvelope, FaLock, FaPhone, FaArrowRight } from "react-icons/fa";
import dbConnect from "@/lib/mongodb";
import BusinessSettings from "@/models/BusinessSettings";

const DEFAULT_HERO_IMAGE = "https://images.unsplash.com/photo-1578181545619-1c74f1ff3d0c?q=80&w=2070&auto=format&fit=crop";

export default function Register({ loginHeroImage = "" }) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    pin: "",
    confirmPin: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "pin" || name === "confirmPin") {
      const numericValue = value.replace(/\D/g, "").slice(0, 4);
      setFormData((prev) => ({ ...prev, [name]: numericValue }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
    setError("");
  };

  const handleKeypad = (value, field) => {
    if (value === "clear") {
      setFormData((prev) => ({ ...prev, [field]: "" }));
    } else if (value === "back") {
      setFormData((prev) => ({ ...prev, [field]: prev[field].slice(0, -1) }));
    } else if (formData[field].length < 4) {
      setFormData((prev) => ({ ...prev, [field]: prev[field] + value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.name.trim()) {
      setError("Full name is required");
      return;
    }

    if (!formData.email.trim()) {
      setError("Email is required");
      return;
    }

    if (formData.pin.length !== 4) {
      setError("PIN must be exactly 4 digits");
      return;
    }

    if (formData.pin !== formData.confirmPin) {
      setError("PINs do not match");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          pin: formData.pin,
          phone: formData.phone.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Registration failed.");
        setLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => router.push("/login"), 2000);
    } catch (err) {
      setError("Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-full flex flex-col lg:flex-row overflow-hidden">
      {/* Left Side - Hero with Image */}
      <motion.div
        initial={{ x: -30, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="hidden lg:flex lg:w-1/2 relative overflow-hidden"
      >
        {/* Background Image - Goat Farm */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url('${loginHeroImage || DEFAULT_HERO_IMAGE}')` }}
        />
        {/* Animated Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/70 via-emerald-900/50 to-emerald-700/40" />
        
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-16 text-white h-full">
          {/* Top Section */}
          <div>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
              className="w-14 h-14 bg-emerald-400/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-8 border border-emerald-300/30"
            >
              <span className="text-3xl">🐐</span>
            </motion.div>
            <motion.h1 
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="text-5xl font-bold mb-3 leading-tight"
            >
              Farm Health
            </motion.h1>
            <motion.p 
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="text-emerald-100 text-lg leading-relaxed max-w-md"
            >
              Join thousands of farmers managing their livestock with confidence
            </motion.p>
          </div>

          {/* Bottom Section - Why Join */}
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="space-y-3"
          >
            <p className="text-xs font-semibold text-emerald-200 uppercase tracking-wider">Why Farm Health?</p>
            <div className="space-y-2">
              {[
                "✓ Centralized health tracking",
                "✓ Secure team collaboration",
                "✓ Instant alerts & insights",
                "✓ Complete farm analytics"
              ].map((item, i) => (
                <p key={i} className="text-sm text-emerald-100 flex items-center gap-2">
                  {item}
                </p>
              ))}
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Right Side - Form */}
      <motion.div
        initial={{ x: 30, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="w-full lg:w-1/2 h-full flex items-center justify-center bg-white"
      >
        <div className="w-full max-w-sm px-4">
          {/* Mobile Header */}
          <div className="lg:hidden text-center mb-3">
            <span className="text-3xl">�</span>
            <h1 className="text-xl font-bold text-gray-800">Farm Health</h1>
          </div>
          
          <div className="mb-4">
            <h2 className="text-xl font-bold text-gray-800">Create Account</h2>
            <p className="text-gray-500 text-sm">Get started today</p>
          </div>

            <AnimatePresence mode="wait">
              {success ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-8"
                >
                  <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <FaCheckCircle className="w-6 h-6 text-emerald-500" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 mb-2">Account Created! 🎉</h3>
                  <p className="text-gray-600 text-sm mb-4">Redirecting to login...</p>
                  <div className="text-emerald-600 font-semibold text-sm">⏳ Please wait...</div>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  onSubmit={handleSubmit}
                  className="space-y-3"
                >
                  {/* Name */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1.5">
                      <FaUser size={11} className="text-emerald-600" /> Full Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="John Doe"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-gray-300 text-gray-700 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1.5">
                      <FaEnvelope size={11} className="text-emerald-600" /> Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="john@example.com"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-gray-300 text-gray-700 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1.5">
                      <FaPhone size={11} className="text-emerald-600" /> Phone <span className="text-gray-400 text-[10px] font-normal">(Optional)</span>
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+234 XXX XXX XXXX"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-gray-300 text-gray-700 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  {/* PIN Inputs */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1.5">
                        <FaLock size={11} className="text-emerald-600" /> PIN
                      </label>
                      <input
                        type="password"
                        name="pin"
                        value={formData.pin}
                        onChange={handleChange}
                        placeholder="••••"
                        maxLength="4"
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-gray-300 text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-center tracking-widest font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1.5">
                        <FaLock size={11} className="text-emerald-600" /> Confirm
                      </label>
                      <input
                        type="password"
                        name="confirmPin"
                        value={formData.confirmPin}
                        onChange={handleChange}
                        placeholder="••••"
                        maxLength="4"
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-gray-300 text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-center tracking-widest font-bold"
                      />
                    </div>
                  </div>

                  <p className="text-[10px] text-gray-400">💡 PIN must be 4 digits</p>

                  {/* Error */}
                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="bg-red-50 border border-red-200 rounded-md px-3 py-1.5 text-red-600 text-xs font-medium flex items-center gap-1.5"
                      >
                        <span>⚠️</span> {error}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Submit */}
                  <motion.button
                    type="submit"
                    disabled={loading}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-2 rounded-lg font-semibold text-white text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed bg-emerald-500 hover:bg-emerald-600"
                  >
                    {loading ? (
                      <>
                        <FaSpinner className="animate-spin" size={14} />
                        Creating...
                      </>
                    ) : (
                      <>
                        <span>Create Account</span>
                        <FaArrowRight size={12} />
                      </>
                    )}
                  </motion.button>

                  {/* Footer */}
                  <p className="text-center text-xs text-gray-500 pt-1">
                    Already have an account?{" "}
                    <Link href="/login" className="text-emerald-600 font-semibold hover:text-emerald-700">
                      Sign in
                    </Link>
                  </p>
                </motion.form>
              )}
            </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

export async function getServerSideProps() {
  try {
    await dbConnect();

    // Fetch business settings for hero image
    const settings = await BusinessSettings.findOne().select("loginHeroImage").lean();
    const loginHeroImage = settings?.loginHeroImage || "";

    return {
      props: {
        loginHeroImage,
      },
    };
  } catch (error) {
    console.error("Error in getServerSideProps:", error);
    return { 
      props: { 
        loginHeroImage: "",
      } 
    };
  }
}

Register.layoutType = 'empty';
