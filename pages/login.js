import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "framer-motion";
import { FaSpinner, FaLock, FaUser, FaMapMarkerAlt, FaLeaf, FaCheckCircle, FaShieldAlt, FaChartLine } from "react-icons/fa";

export default function Login({ staffList = [], locations = [] }) {
  const [selectedUser, setSelectedUser] = useState(null);
  const [location, setLocation] = useState(locations?.[0] || "");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Group users by role
  const staffByRole = useMemo(() => {
    return {
      SuperAdmin: staffList.filter((s) => s.role?.toLowerCase() === "superadmin"),
      Manager: staffList.filter((s) => s.role?.toLowerCase() === "manager"),
      Attendant: staffList.filter((s) => s.role?.toLowerCase() === "attendant"),
    };
  }, [staffList]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!selectedUser) {
      setError("Please select a user.");
      return;
    }

    if (!location) {
      setError("Please select a location.");
      return;
    }

    if (pin.length !== 4) {
      setError("PIN must be 4 digits.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: selectedUser.email,
          pin: pin,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed. Invalid credentials.");
        setPin("");
        setLoading(false);
        return;
      }

      const { token, user } = data;

      // Store token and user info
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify({ ...user, location }));

      // Redirect to dashboard
      router.push("/");
    } catch (err) {
      setError("Login failed. Please try again.");
      setPin("");
    } finally {
      setLoading(false);
    }
  };

  const handleKeypad = (value) => {
    if (value === "clear") {
      setPin("");
    } else if (value === "back") {
      setPin((prev) => prev.slice(0, -1));
    } else if (pin.length < 4) {
      setPin((prev) => prev + value);
    }
  };

  const features = [
    { icon: <FaLeaf className="w-5 h-5" />, text: "Complete Livestock Management" },
    { icon: <FaShieldAlt className="w-5 h-5" />, text: "Secure PIN-Based Access" },
    { icon: <FaChartLine className="w-5 h-5" />, text: "Real-time Analytics & Reports" },
  ];

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex overflow-hidden">
      {/* Left Panel - Branding (Hidden on mobile) */}
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-green-600 via-green-700 to-emerald-800 flex-col justify-between p-10 relative overflow-hidden"
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-40 h-40 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-60 h-60 bg-white rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-white rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2"></div>
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
            Manage Your Farm<br />
            <span className="text-green-200">With Confidence</span>
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-green-100 text-lg mb-10 max-w-md"
          >
            Track livestock health, manage inventory, and streamline operations all in one secure platform.
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

      {/* Right Panel - Login Form */}
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-6 lg:p-10"
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

          {/* Login Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-5 text-center">
              <h2 className="text-xl font-bold text-white">Welcome Back</h2>
              <p className="text-green-100 text-sm mt-1">Enter your PIN to continue</p>
            </div>

            {/* Form */}
            <form onSubmit={handleLogin} className="p-6 space-y-4">
              {/* User Selection */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <FaUser className="text-green-600" />
                  Select User
                </label>
                <select
                  value={selectedUser?.email || ""}
                  onChange={(e) => {
                    const user = staffList.find(u => u.email === e.target.value);
                    setSelectedUser(user || null);
                    setError("");
                  }}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all bg-gray-50 font-medium text-gray-700"
                >
                  <option value="">Choose a user...</option>
                  {staffByRole.SuperAdmin.length > 0 && (
                    <optgroup label="👑 Super Admins">
                      {staffByRole.SuperAdmin.map((user) => (
                        <option key={user.email} value={user.email}>{user.name}</option>
                      ))}
                    </optgroup>
                  )}
                  {staffByRole.Manager.length > 0 && (
                    <optgroup label="📋 Managers">
                      {staffByRole.Manager.map((user) => (
                        <option key={user.email} value={user.email}>{user.name}</option>
                      ))}
                    </optgroup>
                  )}
                  {staffByRole.Attendant.length > 0 && (
                    <optgroup label="👤 Attendants">
                      {staffByRole.Attendant.map((user) => (
                        <option key={user.email} value={user.email}>{user.name}</option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>

              {/* Location Selection */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <FaMapMarkerAlt className="text-green-600" />
                  Farm Location
                </label>
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all bg-gray-50 font-medium text-gray-700"
                >
                  <option value="">Select Location</option>
                  {locations.map((loc) => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>

              {/* PIN Display */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <FaLock className="text-green-600" />
                  4-Digit PIN
                </label>
                <div className="w-full h-14 px-4 border-2 border-gray-200 rounded-xl bg-gray-50 flex items-center justify-center gap-3">
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className={`w-10 h-10 rounded-lg flex items-center justify-center text-2xl font-bold transition-all ${
                        pin.length > i
                          ? "bg-green-600 text-white"
                          : "bg-gray-200 text-gray-400"
                      }`}
                    >
                      {pin.length > i ? "●" : ""}
                    </div>
                  ))}
                </div>
              </div>

              {/* Keypad */}
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, "C", 0, "⌫"].map((key) => (
                  <motion.button
                    key={key}
                    type="button"
                    onClick={() => handleKeypad(key === "C" ? "clear" : key === "⌫" ? "back" : key)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`h-12 rounded-xl font-bold text-lg transition-all ${
                      key === "C" || key === "⌫"
                        ? "bg-red-100 hover:bg-red-200 text-red-600"
                        : "bg-gray-100 hover:bg-green-100 text-gray-700 hover:text-green-700"
                    }`}
                  >
                    {key}
                  </motion.button>
                ))}
              </div>

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

              {/* Login Button */}
              <motion.button
                type="submit"
                disabled={loading || pin.length !== 4}
                whileHover={{ scale: loading ? 1 : 1.02 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
                className={`w-full py-4 rounded-xl font-bold text-white text-lg transition-all shadow-lg flex items-center justify-center gap-2 ${
                  loading || pin.length !== 4
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-green-600 to-emerald-600 hover:shadow-xl hover:from-green-700 hover:to-emerald-700"
                }`}
              >
                {loading ? (
                  <>
                    <FaSpinner className="animate-spin" />
                    Logging in...
                  </>
                ) : (
                  <>
                    <FaCheckCircle />
                    Log In
                  </>
                )}
              </motion.button>
            </form>

            {/* Footer */}
            <div className="px-6 pb-6 text-center">
              <p className="text-gray-600 text-sm">
                Don't have an account?{" "}
                <Link href="/register" className="text-green-600 font-bold hover:text-green-700 hover:underline">
                  Register here
                </Link>
              </p>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

export async function getServerSideProps() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
    
    let staffList = [];
    let locations = ["Default Farm"];

    try {
      const usersRes = await fetch(`${baseUrl}/api/users`);
      if (usersRes && usersRes.ok) {
        const usersData = await usersRes.json();
        staffList = Array.isArray(usersData)
          ? usersData.map((user) => ({
              name: user.name,
              email: user.email,
              role: user.role || "Attendant",
            }))
          : [];
      }
    } catch (e) {
      console.error("Error fetching users:", e);
    }

    try {
      const locationsRes = await fetch(`${baseUrl}/api/locations`);
      if (locationsRes && locationsRes.ok) {
        const locData = await locationsRes.json();
        locations = Array.isArray(locData)
          ? locData.map((loc) => loc.name || loc._id)
          : ["Default Farm"];
      }
    } catch (e) {
      console.error("Error fetching locations:", e);
    }

    return {
      props: {
        staffList: staffList.length > 0 ? staffList : [],
        locations: locations.length > 0 ? locations : ["Default Farm"],
      },
    };
  } catch (error) {
    console.error("Error in getServerSideProps:", error);
    return { props: { staffList: [], locations: ["Default Farm"] } };
  }
}

Login.layoutType = 'empty';
