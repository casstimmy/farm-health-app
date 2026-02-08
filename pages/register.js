import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { FaSpinner, FaCheckCircle, FaUser, FaEnvelope, FaLock, FaPhone, FaArrowRight } from "react-icons/fa";

export default function Register() {
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
    <div className="min-h-screen w-full flex flex-col lg:flex-row">
      {/* Left Side - Hero/Branding */}
      <motion.div
        initial={{ x: -50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="lg:w-1/2 bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 flex items-center justify-center p-8 lg:p-12"
      >
        <div className="text-center lg:text-left max-w-md">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring" }}
            className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-3xl mb-6 shadow-xl"
          >
            <span className="text-5xl">🐑</span>
          </motion.div>
          <motion.h1 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-4xl lg:text-5xl font-bold text-white mb-4"
          >
            Farm Health
          </motion.h1>
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-emerald-100 text-lg mb-6"
          >
            Join our livestock management platform
          </motion.p>
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="hidden lg:flex flex-wrap gap-3"
          >
            {["Easy Setup", "Secure Access", "Team Collaboration", "Real-time Sync"].map((item, i) => (
              <span key={i} className="px-3 py-1.5 bg-white/10 rounded-full text-sm text-emerald-100">
                {item}
              </span>
            ))}
          </motion.div>
        </div>
      </motion.div>

      {/* Right Side - Form */}
      <motion.div
        initial={{ x: 50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="lg:w-1/2 bg-gray-50 flex items-center justify-center p-6 lg:p-12 overflow-y-auto"
      >
        <div className="w-full max-w-md">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-1">Create Account</h2>
            <p className="text-gray-500">Get started with Farm Health</p>
          </div>

          {/* Main Card */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-lg overflow-hidden">
            <div className="px-5 py-6">
            <AnimatePresence mode="wait">
              {success ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-6"
                >
                  <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FaCheckCircle className="w-7 h-7 text-emerald-500" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 mb-2">Account Created! 🎉</h3>
                  <p className="text-gray-600 text-sm mb-4">Redirecting to login...</p>
                  <div className="text-emerald-600 font-semibold text-sm">⏳ Please wait...</div>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  onSubmit={handleSubmit}
                  className="space-y-4"
                >
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <FaUser size={14} className="text-emerald-600" /> Full Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="John Doe"
                      className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <FaEnvelope size={14} className="text-emerald-600" /> Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="john@example.com"
                      className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <FaPhone size={14} className="text-emerald-600" /> Phone <span className="text-gray-400 text-xs font-normal">(Optional)</span>
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+234 XXX XXX XXXX"
                      className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>

                  {/* PIN Inputs */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        <FaLock size={14} className="text-emerald-600" /> PIN
                      </label>
                      <input
                        type="password"
                        name="pin"
                        value={formData.pin}
                        onChange={handleChange}
                        placeholder="••••"
                        maxLength="4"
                        className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-center tracking-widest font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        <FaLock size={14} className="text-emerald-600" /> Confirm
                      </label>
                      <input
                        type="password"
                        name="confirmPin"
                        value={formData.confirmPin}
                        onChange={handleChange}
                        placeholder="••••"
                        maxLength="4"
                        className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-center tracking-widest font-bold"
                      />
                    </div>
                  </div>

                  <p className="text-xs text-gray-500">💡 PIN must be 4 digits</p>

                  {/* Error */}
                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-red-600 text-sm font-medium flex items-center gap-2"
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
                    className="w-full py-2.5 rounded-lg font-semibold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-emerald-500 hover:bg-emerald-600 shadow-md"
                  >
                    {loading ? (
                      <>
                        <FaSpinner className="animate-spin" size={16} />
                        Creating...
                      </>
                    ) : (
                      <>
                        <span>Create Account</span>
                        <FaArrowRight size={14} />
                      </>
                    )}
                  </motion.button>

                  {/* Footer */}
                  <p className="text-center text-sm text-gray-600 pt-2">
                    Already have an account?{" "}
                    <Link href="/login" className="text-emerald-600 font-semibold hover:text-emerald-700 transition-colors">
                      Sign in
                    </Link>
                  </p>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </div>
        </div>
      </motion.div>
    </div>
  );
}

Register.layoutType = 'empty';
