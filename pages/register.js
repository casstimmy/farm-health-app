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
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-72 h-72 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-72 h-72 bg-teal-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>
      </div>

      {/* Register Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md"
      >
        {/* Header Section */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl mb-4 shadow-lg"
          >
            <span className="text-3xl">🐑</span>
          </motion.div>
          <h1 className="text-3xl font-bold text-white mb-2">Farm Health</h1>
          <p className="text-emerald-200 text-sm">Create your account</p>
        </div>

        {/* Main Card */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl shadow-2xl overflow-hidden">
          {/* Card Content */}
          <div className="px-6 py-8">
            <AnimatePresence mode="wait">
              {success ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-8"
                >
                  <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FaCheckCircle className="w-8 h-8 text-emerald-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">Account Created! 🎉</h3>
                  <p className="text-emerald-200 text-sm mb-4">Redirecting to login...</p>
                  <div className="animate-pulse text-emerald-400 font-semibold text-sm">⏳ Please wait...</div>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  onSubmit={handleSubmit}
                  className="space-y-4"
                >
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-semibold text-emerald-300 mb-2 flex items-center gap-2">
                      <FaUser size={14} /> Full Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="John Doe"
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-emerald-100 placeholder-emerald-400/40 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-semibold text-emerald-300 mb-2 flex items-center gap-2">
                      <FaEnvelope size={14} /> Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="john@example.com"
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-emerald-100 placeholder-emerald-400/40 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-semibold text-emerald-300 mb-2 flex items-center gap-2">
                      <FaPhone size={14} /> Phone <span className="text-emerald-400/60 text-xs font-normal">(Optional)</span>
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+234 XXX XXX XXXX"
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-emerald-100 placeholder-emerald-400/40 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  {/* PIN Inputs */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-semibold text-emerald-300 mb-2 flex items-center gap-2">
                        <FaLock size={14} /> PIN
                      </label>
                      <input
                        type="password"
                        name="pin"
                        value={formData.pin}
                        onChange={handleChange}
                        placeholder="••••"
                        maxLength="4"
                        className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-center tracking-widest font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-emerald-300 mb-2 flex items-center gap-2">
                        <FaLock size={14} /> Confirm
                      </label>
                      <input
                        type="password"
                        name="confirmPin"
                        value={formData.confirmPin}
                        onChange={handleChange}
                        placeholder="••••"
                        maxLength="4"
                        className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-center tracking-widest font-bold"
                      />
                    </div>
                  </div>

                  <p className="text-xs text-emerald-400/60">💡 PIN must be 4 digits</p>

                  {/* Error */}
                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="bg-red-500/20 border border-red-400/50 rounded-lg px-4 py-2 text-red-300 text-sm font-medium flex items-center gap-2"
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
                    className="w-full py-3 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-lg"
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
                  <p className="text-center text-sm text-emerald-200 pt-2">
                    Already have an account?{" "}
                    <Link href="/login" className="text-emerald-400 font-semibold hover:text-emerald-300 transition-colors">
                      Sign in
                    </Link>
                  </p>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

Register.layoutType = 'empty';
