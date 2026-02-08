import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "framer-motion";
import { FaSpinner, FaLock, FaUser, FaMapMarkerAlt, FaArrowRight } from "react-icons/fa";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import Location from "@/models/Location";

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
      SuperAdmin: staffList.filter((s) => s.role === "SuperAdmin"),
      Manager: staffList.filter((s) => s.role === "Manager"),
      Attendant: staffList.filter((s) => s.role === "Attendant"),
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
        setError(data.error || "Invalid PIN. Please try again.");
        setPin("");
        setLoading(false);
        return;
      }

      const { token, user } = data;
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify({ ...user, location }));
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
            Animal Welfare & Operations Management
          </motion.p>
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="hidden lg:flex flex-wrap gap-3"
          >
            {["Health Records", "Treatment Tracking", "Inventory", "Reports"].map((item, i) => (
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
            <h2 className="text-2xl font-bold text-gray-800 mb-1">Welcome Back</h2>
            <p className="text-gray-500">Sign in to continue</p>
          </div>

          {/* Main Card */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-lg overflow-hidden">
            <div className="px-5 py-6">
            <form onSubmit={handleLogin} className="space-y-4">
              {/* Staff Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <FaUser size={14} className="text-emerald-600" /> Select Staff
                </label>
                <div className="space-y-1.5 max-h-48 overflow-y-auto border border-gray-200 rounded-xl p-2 bg-gray-50">
                  {Object.entries(staffByRole).map(([role, users]) => (
                    users.length > 0 && (
                      <div key={role}>
                        <p className="text-xs text-gray-500 font-semibold px-2 py-1">{role}</p>
                        {users.map((user) => (
                          <motion.button
                            key={user.email}
                            type="button"
                            onClick={() => {
                              setSelectedUser(user);
                              setPin("");
                              setError("");
                            }}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            className={`w-full text-left px-3 py-2 rounded-lg transition-all ${
                              selectedUser?.email === user.email
                                ? "bg-emerald-500 text-white shadow-md"
                                : "bg-white hover:bg-gray-100 text-gray-700 border border-gray-200"
                            }`}
                          >
                            <p className="font-medium text-sm">{user.name}</p>
                            <p className={`text-xs ${selectedUser?.email === user.email ? "text-emerald-100" : "text-gray-500"}`}>{user.email}</p>
                          </motion.button>
                        ))}
                      </div>
                    )
                  ))}
                </div>
              </div>

              {/* Location Selection */}
              {selectedUser && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <FaMapMarkerAlt size={14} className="text-emerald-600" /> Location
                  </label>
                  <select
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 hover:border-emerald-400 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    {locations.map((loc) => (
                      <option key={loc} value={loc}>
                        {loc}
                      </option>
                    ))}
                  </select>
                </motion.div>
              )}

              {/* PIN Input */}
              <AnimatePresence>
                {selectedUser && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <FaLock size={14} className="text-emerald-600" /> 4-Digit PIN
                    </label>

                    {/* PIN Display Dots */}
                    <div className="flex justify-center gap-3 mb-4">
                      {[0, 1, 2, 3].map((i) => (
                        <motion.div
                          key={i}
                          animate={{ scale: pin.length > i ? 1.1 : 1 }}
                          className={`w-3 h-3 rounded-full border-2 transition-all ${
                            pin.length > i
                              ? "bg-emerald-500 border-emerald-500"
                              : "bg-gray-200 border-gray-300"
                          }`}
                        />
                      ))}
                    </div>

                    {/* Keypad */}
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
                        <motion.button
                          key={num}
                          type="button"
                          onClick={() => handleKeypad(num)}
                          whileTap={{ scale: 0.95 }}
                          className="py-2.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold border border-gray-200 transition-all"
                        >
                          {num}
                        </motion.button>
                      ))}
                      <motion.button
                        type="button"
                        onClick={() => handleKeypad("0")}
                        whileTap={{ scale: 0.95 }}
                        className="col-span-1 py-2.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold border border-gray-200 transition-all"
                      >
                        0
                      </motion.button>
                      <motion.button
                        type="button"
                        onClick={() => handleKeypad("back")}
                        whileTap={{ scale: 0.95 }}
                        className="col-span-1 py-2.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 font-semibold border border-red-200 transition-all text-sm"
                      >
                        ← Back
                      </motion.button>
                      <motion.button
                        type="button"
                        onClick={() => handleKeypad("clear")}
                        whileTap={{ scale: 0.95 }}
                        className="col-span-1 py-2.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-600 font-semibold border border-amber-200 transition-all text-sm"
                      >
                        Clear
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Error Message */}
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

              {/* Submit Button */}
              {selectedUser && (
                <motion.button
                  type="submit"
                  disabled={loading || pin.length !== 4}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-2.5 rounded-lg font-semibold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-emerald-500 hover:bg-emerald-600 shadow-md"
                >
                  {loading ? (
                    <>
                      <FaSpinner className="animate-spin" size={16} />
                      Logging in...
                    </>
                  ) : (
                    <>
                      <span>Sign In</span>
                      <FaArrowRight size={14} />
                    </>
                  )}
                </motion.button>
              )}

              {/* Footer */}
              <p className="text-center text-sm text-gray-600 pt-2">
                New user?{" "}
                <Link href="/register" className="text-emerald-600 font-semibold hover:text-emerald-700 transition-colors">
                  Create account
                </Link>
              </p>
            </form>
          </div>
        </div>
        </div>
      </motion.div>
    </div>
  );
}

export async function getServerSideProps() {
  try {
    await dbConnect();

    // Fetch users directly from database
    const users = await User.find({ isActive: true })
      .select("name email role")
      .sort({ role: 1, name: 1 })
      .lean();

    const staffList = users.map((user) => ({
      name: user.name,
      email: user.email,
      role: user.role,
    }));

    // Fetch locations directly from database
    const locationDocs = await Location.find({ isActive: true })
      .select("name")
      .lean();

    const locations = locationDocs.length > 0 
      ? locationDocs.map((loc) => loc.name)
      : ["Default Farm"];

    return {
      props: {
        staffList: JSON.parse(JSON.stringify(staffList)),
        locations: JSON.parse(JSON.stringify(locations)),
      },
    };
  } catch (error) {
    console.error("Error in getServerSideProps:", error);
    return { 
      props: { 
        staffList: [], 
        locations: ["Default Farm"] 
      } 
    };
  }
}

Login.layoutType = 'empty';
