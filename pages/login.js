import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { FaSpinner, FaLock, FaUser, FaMapMarkerAlt } from "react-icons/fa";

export default function Login({ staffList, locations }) {
  const [name, setName] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [location, setLocation] = useState(locations?.[0] || "");
  const [availableLocations, setAvailableLocations] = useState(locations || []);
  const [showAllLocations, setShowAllLocations] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Filter and organize users by role
  const staffByRole = useMemo(() => {
    console.log("📊 Staff List from props:", staffList);
    return {
      superadmin: staffList.filter((s) => s.role === "superadmin"),
      admin: staffList.filter((s) => s.role === "admin"),
      manager: staffList.filter((s) => s.role === "manager"),
      staff: staffList.filter((s) => s.role === "staff"),
      attendant: staffList.filter((s) => s.role === "attendant"),
    };
  }, [staffList]);

  const selectedUser = staffList.find((u) => u.name === name);
  const isAdminSelected = selectedUser?.role === "admin";

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!name) {
      setError("Please select a user.");
      return;
    }

    if (!location) {
      setError("Please select a location.");
      return;
    }

    if (password.length !== 4) {
      setError("PIN must be 4 digits.");
      return;
    }

    setLoading(true);

    try {
      const selectedUser = staffList.find((u) => u.name === name);
      
      if (!selectedUser?.email) {
        setError("User email not found. Please try again.");
        setLoading(false);
        return;
      }

      // Login with actual email from database
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: selectedUser.email,
          password: password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed. Invalid credentials.");
        setPassword("");
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
      setPassword("");
    } finally {
      setLoading(false);
    }
  };

  const handleKeypad = (value) => {
    if (value === "clear") {
      setPassword("");
    } else if (value === "back") {
      setPassword((prev) => prev.slice(0, -1));
    } else if (password.length < 4) {
      setPassword((prev) => prev + value);
    }
  };

  return (
    <div className="min-h-[50vh] w-screen bg-gradient-to-br from-green-50 via-emerald-50 to-cyan-50 flex items-center justify-center overflow-hidden">
      {/* Full Screen Container */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full flex items-center justify-center"
        style={{ minHeight: "50vh" }}
      >
        {/* Left Section - Hero (Hidden on Mobile) */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="hidden lg:flex flex-col justify-center w-1/2 px-12"
        >
          <div className="mb-4 inline-block">
            <span className="text-6xl">🐑</span>
          </div>
          <h1 className="text-5xl lg:text-6xl font-extrabold text-gray-900 mb-6 leading-tight">
            Farm Health <span className="text-green-600">System</span>
          </h1>
          <p className="text-xl text-gray-700 mb-8 leading-relaxed">
            Complete farm management system for livestock health records, inventory tracking, and seamless operations management.
          </p>
          <div className="flex flex-col gap-4">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold px-8 py-4 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl w-fit"
            >
              ➕ Create New Account
            </Link>
            <a
              href="#features"
              className="inline-flex items-center justify-center gap-2 bg-white text-green-600 font-bold px-8 py-4 rounded-xl border-2 border-green-200 hover:border-green-400 transition-all duration-200 w-fit"
            >
              Learn More
            </a>
          </div>
        </motion.div>

        {/* Right Section - Login Form (Centered on Mobile) */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="w-full lg:w-1/2 flex items-center justify-center px-4 py-6"
        >
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-gray-100 max-h-[calc(100vh-3rem)] overflow-y-auto">
            <div className="p-6 md:p-10">
              {/* Logo */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.4, delay: 0.4 }}
                className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl mx-auto mb-3"
              >
                <span className="text-xl">🐑</span>
              </motion.div>

              <h2 className="text-xl font-bold text-center text-gray-900 mb-1">
                Welcome Back
              </h2>
              <p className="text-center text-xs text-gray-600 mb-4 font-medium">
                Access your farm management system
              </p>

              <form onSubmit={handleLogin} className="space-y-3">
                {/* User Dropdown */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1.5">
                    <FaUser className="text-green-600" size={13} />
                    Select User
                  </label>
                  <select
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-1.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-200 transition-all bg-white font-medium text-xs"
                  >
                  <option value="" disabled>
                    Choose a user...
                  </option>
                  {staffByRole.superadmin.length > 0 && (
                    <optgroup label="👑 Super Administrators">
                      {staffByRole.superadmin.map((user, idx) => (
                        <option key={`superadmin-${idx}`} value={user.name}>
                          {user.name}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {staffByRole.admin.length > 0 && (
                    <optgroup label="👑 Administrators">
                      {staffByRole.admin.map((user, idx) => (
                        <option key={`admin-${idx}`} value={user.name}>
                          {user.name}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {staffByRole.manager.length > 0 && (
                    <optgroup label="📋 Managers">
                      {staffByRole.manager.map((user, idx) => (
                        <option key={`manager-${idx}`} value={user.name}>
                          {user.name}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {staffByRole.attendant.length > 0 && (
                    <optgroup label="👤 Attendants">
                      {staffByRole.attendant.map((user, idx) => (
                        <option key={`attendant-${idx}`} value={user.name}>
                          {user.name}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
                </motion.div>

                {/* Location Dropdown */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.55 }}
                >
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1.5">
                    <FaMapMarkerAlt className="text-green-600" size={13} />
                    Farm Location
                  </label>
                  <select
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-3 py-1.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-200 transition-all bg-white font-medium text-xs"
                  >
                  <option value="">Select Location</option>
                  {availableLocations && availableLocations.length > 0 ? (
                    availableLocations.map((loc) => (
                      <option key={loc} value={loc}>
                        {loc}
                      </option>
                    ))
                  ) : (
                    <option disabled>No locations available</option>
                  )}
                </select>
              </motion.div>

              {/* PIN Display */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1.5">
                  <FaLock className="text-green-600" size={13} />
                  Password (4-Digit PIN)
                </label>
                <div className="w-full h-16 px-3 py-2 border-2 border-gray-300 rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 text-3xl tracking-widest font-bold flex items-center justify-center text-green-600">
                  {"●".repeat(password.length)}
                </div>
              </motion.div>

              {/* Numeric Keypad */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.65 }}
                className="grid grid-cols-3 gap-1"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, "C", 0, "←"].map((key, idx) => (
                  <motion.button
                    key={key}
                    type="button"
                    onClick={() =>
                      handleKeypad(
                        key === "C" ? "clear" : key === "←" ? "back" : key
                      )
                    }
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.92 }}
                    className={`py-3 rounded-lg font-bold text-base transition-all active:ring-2 active:ring-offset-1 ${
                      key === "C" || key === "←"
                        ? "bg-red-500 hover:bg-red-600 active:bg-red-700 text-white shadow-lg"
                        : "bg-green-100 hover:bg-green-200 active:bg-green-300 text-green-800 font-semibold shadow-md"
                    }`}
                  >
                    {key}
                  </motion.button>
                ))}
              </motion.div>

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-50 border-l-4 border-red-500 text-red-700 px-3 py-2 rounded-lg text-xs font-medium"
                >
                  ⚠️ {error}
                </motion.div>
              )}

              {/* Login Button */}
              <motion.button
                type="submit"
                disabled={loading}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.94 }}
                className={`w-full py-4 rounded-lg font-bold text-white text-base transition-all shadow-lg flex items-center justify-center gap-2 active:ring-2 active:ring-offset-2 active:ring-green-300 ${
                  loading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-green-600 to-emerald-600 hover:shadow-xl active:from-green-700 active:to-emerald-700"
                }`}
              >
                {loading ? (
                  <>
                    <FaSpinner className="animate-spin" size={12} />
                    Logging in...
                  </>
                ) : (
                  "✓ Log In"
                )}
              </motion.button>
            </form>

            {/* Divider */}
            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-white text-gray-500 font-medium text-xs">or</span>
              </div>
            </div>

            {/* Footer */}
            <p className="text-center text-xs text-gray-600 font-medium">
              Don't have an account?{" "}
              <Link href="/register" className="text-green-600 font-bold hover:text-green-700 hover:underline transition">
                Register here
              </Link>
            </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

export async function getServerSideProps() {
  try {
    // Fetch users from database
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
    
    let staffList = [];
    let locations = ["Default Farm"];

    try {
      const usersRes = await fetch(`${baseUrl}/api/users`, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (usersRes && usersRes.ok) {
        const usersData = await usersRes.json();
        staffList = Array.isArray(usersData)
          ? usersData.map((user) => ({
              name: user.name,
              email: user.email,
              role: user.role?.toLowerCase() || "attendant",
            }))
          : [];
      }
    } catch (userError) {
      console.error("Error fetching users:", userError);
    }

    // Fetch locations from database
    try {
      const locationsRes = await fetch(`${baseUrl}/api/locations`, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (locationsRes && locationsRes.ok) {
        const locData = await locationsRes.json();
        locations = Array.isArray(locData)
          ? locData.map((loc) => loc.name || loc._id)
          : ["Default Farm"];
      }
    } catch (locError) {
      console.error("Error fetching locations:", locError);
    }

    return {
      props: {
        staffList: staffList.length > 0 ? staffList : [],
        locations: locations.length > 0 ? locations : ["Default Farm"],
      },
    };
  } catch (error) {
    console.error("Error in getServerSideProps:", error);
    return {
      props: {
        staffList: [],
        locations: ["Default Farm"],
      },
    };
  }
}

// Specify layout for this page
Login.layoutType = 'auth';
Login.layoutProps = { title: 'Login' };
