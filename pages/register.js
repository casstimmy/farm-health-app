import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { FaSpinner, FaCheckCircle, FaUser, FaEnvelope, FaLock, FaPhone, FaLeaf, FaShieldAlt, FaUsers } from "react-icons/fa";

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
    // For PIN fields, only allow digits
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
    setSuccess(false);

    // Validation
    if (!formData.name.trim()) {
      setError("Full name is required");
      return;
    }

    if (!formData.email.trim()) {
      setError("Email address is required");
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
        setError(data.error || "Registration failed. Please try again.");
        setLoading(false);
        return;
      }

      // Success
      setSuccess(true);
      setFormData({ name: "", email: "", phone: "", pin: "", confirmPin: "" });

      // Redirect after 2 seconds
      setTimeout(() => {
        router.push("/login?registered=true");
      }, 2000);
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: <FaLeaf className="w-5 h-5" />, text: "Track Livestock Health" },
    { icon: <FaShieldAlt className="w-5 h-5" />, text: "Secure Data Storage" },
    { icon: <FaUsers className="w-5 h-5" />, text: "Team Collaboration" },
  ];

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex overflow-hidden">
      {/* Left Panel - Branding (Hidden on mobile) */}
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-emerald-600 via-green-700 to-teal-800 flex-col justify-between p-10 relative overflow-hidden"
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 right-10 w-48 h-48 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 left-20 w-64 h-64 bg-white rounded-full blur-3xl"></div>
          <div className="absolute top-1/3 left-1/3 w-72 h-72 bg-white rounded-full blur-3xl"></div>
        </div>

        {/* Logo & Title */}
        <div className="relative z-10">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring" }}
            className="flex items-center gap-4 mb-8"
          >
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <span className="text-4xl">🐑</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Farm Health</h1>
              <p className="text-green-200 text-sm font-medium">Management System</p>
            </div>
          </motion.div>
        </div>

        {/* Main Content */}
        <div className="relative z-10 flex-1 flex flex-col justify-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-4xl font-bold text-white mb-6 leading-tight"
          >
            Join Our<br />
            <span className="text-green-200">Farming Community</span>
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-green-100 text-lg mb-10 max-w-md"
          >
            Create your account and start managing your farm operations efficiently with our comprehensive platform.
          </motion.p>

          {/* Feature List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="space-y-4"
          >
            {features.map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 + idx * 0.1 }}
                className="flex items-center gap-4 text-white"
              >
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  {feature.icon}
                </div>
                <span className="font-medium">{feature.text}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Footer */}
        <div className="relative z-10">
          <p className="text-green-200 text-sm">© 2025 Farm Health System. All rights reserved.</p>
        </div>
      </motion.div>

      {/* Right Panel - Register Form */}
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-6 lg:p-10 overflow-y-auto"
      >
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="lg:hidden flex items-center justify-center gap-3 mb-6"
          >
            <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center">
              <span className="text-2xl">🐑</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Farm Health</h1>
              <p className="text-gray-500 text-xs">Management System</p>
            </div>
          </motion.div>

          {/* Register Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-600 to-green-600 px-6 py-5 text-center">
              <h2 className="text-xl font-bold text-white">Create Account</h2>
              <p className="text-green-100 text-sm mt-1">Join the Farm Health System</p>
            </div>

            <AnimatePresence mode="wait">
              {success ? (
                // Success State
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="p-8 text-center"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring" }}
                    className="flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mx-auto mb-6"
                  >
                    <FaCheckCircle className="w-10 h-10 text-green-600" />
                  </motion.div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">Account Created! 🎉</h3>
                  <p className="text-gray-600 mb-6">
                    Your account has been successfully created. Redirecting to login...
                  </p>
                  <motion.div
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="text-green-600 font-bold"
                  >
                    ⏳ Redirecting...
                  </motion.div>
                </motion.div>
              ) : (
                // Form State
                <motion.form
                  key="form"
                  onSubmit={handleSubmit}
                  className="p-6 space-y-4"
                >
                  {/* Full Name */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                      <FaUser className="text-green-600" />
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="John Doe"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all font-medium"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                      <FaEnvelope className="text-green-600" />
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="john@example.com"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all font-medium"
                    />
                  </div>

                  {/* Phone (Optional) */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                      <FaPhone className="text-green-600" />
                      Phone Number <span className="text-gray-400 text-xs">(Optional)</span>
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+234 XXX XXX XXXX"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all font-medium"
                    />
                  </div>

                  {/* PIN Row */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* PIN */}
                    <div>
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                        <FaLock className="text-green-600" />
                        PIN <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="password"
                        name="pin"
                        value={formData.pin}
                        onChange={handleChange}
                        placeholder="••••"
                        maxLength="4"
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all text-center text-xl tracking-widest font-bold"
                      />
                    </div>

                    {/* Confirm PIN */}
                    <div>
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                        <FaLock className="text-green-600" />
                        Confirm <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="password"
                        name="confirmPin"
                        value={formData.confirmPin}
                        onChange={handleChange}
                        placeholder="••••"
                        maxLength="4"
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all text-center text-xl tracking-widest font-bold"
                      />
                    </div>
                  </div>

                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    💡 PIN must be exactly 4 digits
                  </p>

                  {/* Error Message */}
                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg text-sm font-medium"
                      >
                        ⚠️ {error}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Submit Button */}
                  <motion.button
                    type="submit"
                    disabled={loading}
                    whileHover={{ scale: loading ? 1 : 1.02 }}
                    whileTap={{ scale: loading ? 1 : 0.98 }}
                    className={`w-full py-4 rounded-xl font-bold text-white text-lg transition-all shadow-lg flex items-center justify-center gap-2 ${
                      loading
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-gradient-to-r from-emerald-600 to-green-600 hover:shadow-xl hover:from-emerald-700 hover:to-green-700"
                    }`}
                  >
                    {loading ? (
                      <>
                        <FaSpinner className="animate-spin" />
                        Creating Account...
                      </>
                    ) : (
                      <>
                        <FaCheckCircle />
                        Create Account
                      </>
                    )}
                  </motion.button>
                </motion.form>
              )}
            </AnimatePresence>

            {/* Footer */}
            {!success && (
              <div className="px-6 pb-6 text-center">
                <p className="text-gray-600 text-sm">
                  Already have an account?{" "}
                  <Link href="/login" className="text-green-600 font-bold hover:text-green-700 hover:underline">
                    Sign in here
                  </Link>
                </p>
              </div>
            )}
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

Register.layoutType = 'empty';
