import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { FaSpinner, FaCheckCircle, FaUser, FaEnvelope, FaLock, FaPhone } from "react-icons/fa";

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
    <div className="h-screen w-screen bg-gradient-to-br from-emerald-600 via-green-700 to-teal-800 flex items-center justify-center p-4 overflow-hidden">
      {/* Register Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-green-600 px-6 py-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <span className="text-3xl">🐑</span>
            <h1 className="text-xl font-bold text-white">Farm Health</h1>
          </div>
          <p className="text-green-100 text-xs">Create your account</p>
        </div>

        <AnimatePresence mode="wait">
          {success ? (
            <motion.div
              key="success"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-8 text-center"
            >
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaCheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Account Created! 🎉</h3>
              <p className="text-gray-600 text-sm mb-4">Redirecting to login...</p>
              <div className="animate-pulse text-green-600 font-semibold text-sm">⏳ Please wait...</div>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              onSubmit={handleSubmit}
              className="p-5 space-y-3"
            >
              {/* Name */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 mb-1">
                  <FaUser className="text-green-600" size={12} />
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:outline-none focus:border-green-500"
                />
              </div>

              {/* Email */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 mb-1">
                  <FaEnvelope className="text-green-600" size={12} />
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="john@example.com"
                  className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:outline-none focus:border-green-500"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 mb-1">
                  <FaPhone className="text-green-600" size={12} />
                  Phone <span className="text-gray-400 text-xs">(Optional)</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+234 XXX XXX XXXX"
                  className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:outline-none focus:border-green-500"
                />
              </div>

              {/* PIN Row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 mb-1">
                    <FaLock className="text-green-600" size={12} />
                    PIN <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    name="pin"
                    value={formData.pin}
                    onChange={handleChange}
                    placeholder="••••"
                    maxLength="4"
                    className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:outline-none focus:border-green-500 text-center tracking-widest font-bold"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 mb-1">
                    <FaLock className="text-green-600" size={12} />
                    Confirm <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    name="confirmPin"
                    value={formData.confirmPin}
                    onChange={handleChange}
                    placeholder="••••"
                    maxLength="4"
                    className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:outline-none focus:border-green-500 text-center tracking-widest font-bold"
                  />
                </div>
              </div>

              <p className="text-xs text-gray-400">💡 PIN must be 4 digits</p>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="bg-red-50 border-l-4 border-red-500 text-red-700 px-3 py-2 rounded text-xs font-medium"
                  >
                    ⚠️ {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit */}
              <motion.button
                type="submit"
                disabled={loading}
                whileTap={{ scale: 0.98 }}
                className={`w-full py-3 rounded-lg font-bold text-white text-sm flex items-center justify-center gap-2 ${
                  loading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 shadow-lg"
                }`}
              >
                {loading ? (
                  <>
                    <FaSpinner className="animate-spin" size={14} />
                    Creating...
                  </>
                ) : (
                  <>
                    <FaCheckCircle size={14} />
                    Create Account
                  </>
                )}
              </motion.button>

              {/* Footer */}
              <p className="text-center text-xs text-gray-500 pt-1">
                Already have an account?{" "}
                <Link href="/login" className="text-green-600 font-semibold hover:underline">
                  Sign in
                </Link>
              </p>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

Register.layoutType = 'empty';
