import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "framer-motion";
import { FaSpinner, FaLock, FaUser, FaMapMarkerAlt, FaCheckCircle } from "react-icons/fa";
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
    <div className="h-screen w-screen bg-gradient-to-br from-green-600 via-green-700 to-emerald-800 flex items-center justify-center p-4 overflow-hidden">
      {/* Login Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <span className="text-3xl">🐑</span>
            <h1 className="text-xl font-bold text-white">Farm Health</h1>
          </div>
          <p className="text-green-100 text-xs">Enter your PIN to continue</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="p-5 space-y-3">
          {/* User Selection */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 mb-1">
              <FaUser className="text-green-600" size={12} />
              Select User
            </label>
            <select
              value={selectedUser?.email || ""}
              onChange={(e) => {
                const user = staffList.find(u => u.email === e.target.value);
                setSelectedUser(user || null);
                setError("");
              }}
              className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:outline-none focus:border-green-500 bg-gray-50 font-medium"
            >
              <option value="">Choose user...</option>
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
            <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 mb-1">
              <FaMapMarkerAlt className="text-green-600" size={12} />
              Location
            </label>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:outline-none focus:border-green-500 bg-gray-50 font-medium"
            >
              <option value="">Select location...</option>
              {locations.map((loc) => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>

          {/* PIN Display */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 mb-1">
              <FaLock className="text-green-600" size={12} />
              4-Digit PIN
            </label>
            <div className="flex items-center justify-center gap-2 py-2">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl font-bold transition-all ${
                    pin.length > i
                      ? "bg-green-600 text-white shadow-md"
                      : "bg-gray-100 border-2 border-gray-200"
                  }`}
                >
                  {pin.length > i ? "●" : ""}
                </div>
              ))}
            </div>
          </div>

          {/* Keypad */}
          <div className="grid grid-cols-3 gap-1.5">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, "C", 0, "⌫"].map((key) => (
              <motion.button
                key={key}
                type="button"
                onClick={() => handleKeypad(key === "C" ? "clear" : key === "⌫" ? "back" : key)}
                whileTap={{ scale: 0.95 }}
                className={`h-11 rounded-lg font-bold text-base transition-all ${
                  key === "C" || key === "⌫"
                    ? "bg-red-100 text-red-600 hover:bg-red-200"
                    : "bg-gray-100 text-gray-700 hover:bg-green-100 hover:text-green-700"
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
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-red-50 border-l-4 border-red-500 text-red-700 px-3 py-2 rounded text-xs font-medium"
              >
                ⚠️ {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Login Button */}
          <motion.button
            type="submit"
            disabled={loading || pin.length !== 4}
            whileTap={{ scale: 0.98 }}
            className={`w-full py-3 rounded-lg font-bold text-white text-sm transition-all flex items-center justify-center gap-2 ${
              loading || pin.length !== 4
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg"
            }`}
          >
            {loading ? (
              <>
                <FaSpinner className="animate-spin" size={14} />
                Logging in...
              </>
            ) : (
              <>
                <FaCheckCircle size={14} />
                Log In
              </>
            )}
          </motion.button>

          {/* Footer */}
          <p className="text-center text-xs text-gray-500 pt-1">
            New user?{" "}
            <Link href="/register" className="text-green-600 font-semibold hover:underline">
              Register
            </Link>
          </p>
        </form>
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
