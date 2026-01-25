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
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-72 h-72 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-72 h-72 bg-teal-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>
      </div>

      {/* Login Card */}
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
          <p className="text-emerald-200 text-sm">Animal Welfare & Operations</p>
        </div>

        {/* Main Card */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl shadow-2xl overflow-hidden">
          {/* Card Content */}
          <div className="px-6 py-8">
            <form onSubmit={handleLogin} className="space-y-5">
              {/* Staff Selection */}
              <div>
                <label className="block text-sm font-semibold text-emerald-300 mb-3 flex items-center gap-2">
                  <FaUser size={14} /> Select Staff
                </label>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {Object.entries(staffByRole).map(([role, users]) => (
                    users.length > 0 && (
                      <div key={role}>
                        <p className="text-xs text-emerald-400/60 font-semibold px-3 py-1 mb-1">{role}</p>
                        {users.map((user) => (
                          <motion.button
                            key={user.email}
                            type="button"
                            onClick={() => {
                              setSelectedUser(user);
                              setPin("");
                              setError("");
                            }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={`w-full text-left px-4 py-2.5 rounded-xl transition-all ${
                              selectedUser?.email === user.email
                                ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg"
                                : "bg-white/5 hover:bg-white/10 text-emerald-100 border border-white/10"
                            }`}
                          >
                            <p className="font-medium text-sm">{user.name}</p>
                            <p className="text-xs opacity-70">{user.email}</p>
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
                  <label className="block text-sm font-semibold text-emerald-300 mb-2 flex items-center gap-2">
                    <FaMapMarkerAlt size={14} /> Location
                  </label>
                  <select
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-emerald-100 hover:bg-white/10 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {locations.map((loc) => (
                      <option key={loc} value={loc} className="bg-slate-900 text-white">
                        {loc}
                      </option>
                    ))}
                  </select>
                </motion.div>
              )}

              {/* PIN Input - Modern Design */}
              <AnimatePresence>
                {selectedUser && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <label className="block text-sm font-semibold text-emerald-300 mb-3 flex items-center gap-2">
                      <FaLock size={14} /> 4-Digit PIN
                    </label>

                    {/* PIN Display Dots */}
                    <div className="flex justify-center gap-2 mb-6">
                      {[0, 1, 2, 3].map((i) => (
                        <motion.div
                          key={i}
                          animate={{ scale: pin.length > i ? 1.1 : 1 }}
                          className={`w-4 h-4 rounded-full border-2 transition-all ${
                            pin.length > i
                              ? "bg-emerald-500 border-emerald-400"
                              : "bg-white/10 border-white/20"
                          }`}
                        />
                      ))}
                    </div>

                    {/* Keypad */}
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
                        <motion.button
                          key={num}
                          type="button"
                          onClick={() => handleKeypad(num)}
                          whileTap={{ scale: 0.95 }}
                          className="py-3 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold border border-white/10 transition-all"
                        >
                          {num}
                        </motion.button>
                      ))}
                      <motion.button
                        type="button"
                        onClick={() => handleKeypad("0")}
                        whileTap={{ scale: 0.95 }}
                        className="col-span-1 py-3 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold border border-white/10 transition-all"
                      >
                        0
                      </motion.button>
                      <motion.button
                        type="button"
                        onClick={() => handleKeypad("back")}
                        whileTap={{ scale: 0.95 }}
                        className="col-span-1 py-3 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 font-semibold border border-red-400/30 transition-all text-sm"
                      >
                        ← Back
                      </motion.button>
                      <motion.button
                        type="button"
                        onClick={() => handleKeypad("clear")}
                        whileTap={{ scale: 0.95 }}
                        className="col-span-1 py-3 rounded-lg bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 font-semibold border border-yellow-400/30 transition-all text-sm"
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
                    className="bg-red-500/20 border border-red-400/50 rounded-lg px-4 py-2 text-red-300 text-sm font-medium flex items-center gap-2"
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
                  className="w-full py-3 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-lg"
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
              <p className="text-center text-sm text-emerald-200 pt-2">
                New user?{" "}
                <Link href="/register" className="text-emerald-400 font-semibold hover:text-emerald-300 transition-colors">
                  Create account
                </Link>
              </p>
            </form>
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
