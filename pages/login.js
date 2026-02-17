import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "framer-motion";
import { FaSpinner, FaLock, FaUser, FaMapMarkerAlt, FaArrowRight } from "react-icons/fa";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import Location from "@/models/Location";
import BusinessSettings from "@/models/BusinessSettings";

const DEFAULT_HERO_IMAGE = "https://images.unsplash.com/photo-1577720643272-265a02b3d099?q=80&w=2070&auto=format&fit=crop";

export default function Login({
  staffList = [],
  locations = [],
  loginHeroImage = "",
  businessLogo = "",
  businessName = "Farm Health",
}) {
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
              className="w-14 h-14 bg-emerald-400/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-8 border border-emerald-300/30 overflow-hidden"
            >
              {businessLogo ? (
                <img src={businessLogo} alt="Business Logo" className="w-full h-full object-contain p-1 bg-white/80" />
              ) : (
                <span className="text-lg font-bold">FH</span>
              )}
            </motion.div>
            <motion.h1 
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="text-5xl font-bold mb-3 leading-tight"
            >
              {businessName}
            </motion.h1>
            <motion.p 
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="text-emerald-100 text-lg leading-relaxed max-w-md"
            >
              Professional livestock management and integrated health tracking for modern farms
            </motion.p>
          </div>

          {/* Bottom Section - Features */}
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="space-y-3"
          >
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: "📊", label: "Real-time Tracking" },
                { icon: "💊", label: "Health Records" },
                { icon: "👥", label: "Team Collaboration" },
                { icon: "📈", label: "Performance Analytics" }
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-2 bg-white/10 backdrop-blur-md rounded-lg border border-white/10 hover:border-emerald-300/50 transition-all">
                  <span className="text-lg">{feature.icon}</span>
                  <span className="text-xs font-medium text-emerald-50">{feature.label}</span>
                </div>
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
            {businessLogo ? (
              <img src={businessLogo} alt="Business Logo" className="w-12 h-12 object-contain mx-auto mb-1" />
            ) : (
              <span className="text-xl font-bold text-gray-700">FH</span>
            )}
            <h1 className="text-xl font-bold text-gray-800">{businessName}</h1>
          </div>

          <div className="mb-4">
            <h2 className="text-xl font-bold text-gray-800">Welcome Back</h2>
            <p className="text-gray-500 text-sm">Sign in to continue</p>
          </div>

          {/* Form - No Card wrapper needed */}
            <form onSubmit={handleLogin} className="space-y-3">
              {/* Staff Selection */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 flex items-center gap-1.5">
                  <FaUser size={12} className="text-emerald-600" /> Select Staff
                </label>
                <div className="space-y-1 max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-1.5 bg-gray-50">
                  {Object.entries(staffByRole).map(([role, users]) => (
                    users.length > 0 && (
                      <div key={role}>
                        <p className="text-[10px] text-gray-400 font-semibold px-2 py-0.5">{role}</p>
                        {users.map((user) => (
                          <motion.button
                            key={user.email}
                            type="button"
                            onClick={() => {
                              setSelectedUser(user);
                              setPin("");
                              setError("");
                            }}
                            whileTap={{ scale: 0.98 }}
                            className={`w-full text-left px-2.5 py-1.5 rounded-md transition-all ${
                              selectedUser?.email === user.email
                                ? "bg-emerald-500 text-white"
                                : "bg-white hover:bg-gray-100 text-gray-700 border border-gray-200"
                            }`}
                          >
                            <p className="font-medium text-sm">{user.name}</p>
                            <p className={`text-[11px] ${selectedUser?.email === user.email ? "text-emerald-100" : "text-gray-400"}`}>{user.email}</p>
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
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  transition={{ duration: 0.2 }}
                >
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 flex items-center gap-1.5">
                    <FaMapMarkerAlt size={12} className="text-emerald-600" /> Location
                  </label>
                  <select
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-gray-300 text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 flex items-center gap-1.5">
                      <FaLock size={12} className="text-emerald-600" /> 4-Digit PIN
                    </label>

                    {/* PIN Display Dots */}
                    <div className="flex justify-center gap-2 mb-2">
                      {[0, 1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className={`w-2.5 h-2.5 rounded-full transition-all ${
                            pin.length > i
                              ? "bg-emerald-500"
                              : "bg-gray-200"
                          }`}
                        />
                      ))}
                    </div>

                    {/* Keypad */}
                    <div className="grid grid-cols-3 gap-1.5">
                      {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
                        <motion.button
                          key={num}
                          type="button"
                          onClick={() => handleKeypad(num)}
                          whileTap={{ scale: 0.95 }}
                          className="py-2 rounded-md bg-gray-50 hover:bg-gray-100 text-gray-800 font-medium text-sm border border-gray-200"
                        >
                          {num}
                        </motion.button>
                      ))}
                      <motion.button
                        type="button"
                        onClick={() => handleKeypad("0")}
                        whileTap={{ scale: 0.95 }}
                        className="py-2 rounded-md bg-gray-50 hover:bg-gray-100 text-gray-800 font-medium text-sm border border-gray-200"
                      >
                        0
                      </motion.button>
                      <motion.button
                        type="button"
                        onClick={() => handleKeypad("back")}
                        whileTap={{ scale: 0.95 }}
                        className="py-2 rounded-md bg-red-50 hover:bg-red-100 text-red-500 font-medium text-xs border border-red-200"
                      >
                        ← Back
                      </motion.button>
                      <motion.button
                        type="button"
                        onClick={() => handleKeypad("clear")}
                        whileTap={{ scale: 0.95 }}
                        className="py-2 rounded-md bg-amber-50 hover:bg-amber-100 text-amber-500 font-medium text-xs border border-amber-200"
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
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="bg-red-50 border border-red-200 rounded-md px-3 py-1.5 text-red-600 text-xs font-medium flex items-center gap-1.5"
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
                  className="w-full py-2 rounded-lg font-semibold text-white text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed bg-emerald-500 hover:bg-emerald-600"
                >
                  {loading ? (
                    <>
                      <FaSpinner className="animate-spin" size={14} />
                      Signing in...
                    </>
                  ) : (
                    <>
                      <span>Sign In</span>
                      <FaArrowRight size={12} />
                    </>
                  )}
                </motion.button>
              )}

              {/* Footer */}
              <p className="text-center text-xs text-gray-500 pt-1">
                New user?{" "}
                <Link href="/register" className="text-emerald-600 font-semibold hover:text-emerald-700">
                  Create account
                </Link>
              </p>
            </form>
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

    // Fetch business settings for branding and hero image
    const settings = await BusinessSettings.findOne()
      .select("loginHeroImage businessLogo businessName")
      .lean();
    const loginHeroImage = settings?.loginHeroImage || "";
    const businessLogo = settings?.businessLogo || "";
    const businessName = settings?.businessName || "Farm Health";

    return {
      props: {
        staffList: JSON.parse(JSON.stringify(staffList)),
        locations: JSON.parse(JSON.stringify(locations)),
        loginHeroImage,
        businessLogo,
        businessName,
      },
    };
  } catch (error) {
    console.error("Error in getServerSideProps:", error);
    return { 
      props: { 
        staffList: [], 
        locations: ["Default Farm"],
        loginHeroImage: "",
        businessLogo: "",
        businessName: "Farm Health",
      } 
    };
  }
}

Login.layoutType = 'empty';
