import Link from "next/link";
import { useRouter } from "next/router";
import { useState, useContext, useEffect, useRef } from "react";
import { FaBars, FaTimes, FaHome, FaLeaf, FaBoxes, FaUsers, FaSignOutAlt, FaCog, FaChevronDown, FaClipboardList, FaUserCircle, FaBell, FaMoneyBillWave } from "react-icons/fa";
import { BusinessContext } from "@/context/BusinessContext";

export default function Navbar() {
  const router = useRouter();
  const { businessSettings } = useContext(BusinessContext);
  const [isOpen, setIsOpen] = useState(false);
  const [setupOpen, setSetupOpen] = useState(false);
  const [mobileSetupOpen, setMobileSetupOpen] = useState(false);
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [pendingTasks, setPendingTasks] = useState(0);
  const userMenuRef = useRef(null);

  // Load user from localStorage
  useEffect(() => {
    try {
      const userData = localStorage.getItem("user");
      if (userData) setUser(JSON.parse(userData));
      const tk = localStorage.getItem("token");
      if (tk) setToken(tk);
    } catch { /* ignore */ }
  }, []);

  // Fetch pending tasks count for current user
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const tk = localStorage.getItem("token");
        if (!tk) return;
        const res = await fetch("/api/tasks", {
          headers: { Authorization: `Bearer ${tk}` },
        });
        if (!res.ok) return;
        const tasks = await res.json();
        const myTasks = Array.isArray(tasks) ? tasks.filter(t =>
          (t.status === "Pending" || t.status === "In Progress") &&
          (t.assignedTo === user?._id || t.assignedTo?._id === user?._id)
        ) : [];
        setPendingTasks(myTasks.length);
      } catch { /* ignore */ }
    };
    if (user?._id) fetchTasks();
  }, [user?._id]);

  // Close user menu on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
    router.push("/login");
  };

  const isActive = (path) => router.pathname === path;

  const navLinks = [
    { href: "/", label: "Dashboard", icon: FaHome },
    { href: "/manage/animals", label: "Animals", icon: FaLeaf },
    { href: "/manage/inventory", label: "Inventory", icon: FaBoxes },
    { href: "/manage/tasks", label: "Tasks", icon: FaClipboardList },
    { href: "/manage/expenses", label: "Expenses", icon: FaMoneyBillWave },
    { href: "/manage/users", label: "Users", icon: FaUsers },
  ];

  const setupItems = [
    { href: "/manage/locations", label: "📍 Manage Locations" },
    { href: "/manage/business-setup", label: "🏢 Business Setup" },
  ];

  return (
    <nav className="bg-gradient-to-r from-green-700 to-green-600 text-white shadow-xl sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo & Business Name */}
          <Link href="/" className="font-bold text-2xl flex items-center gap-2 hover:opacity-90 transition">
            {businessSettings.businessLogo ? (
              <img 
                src={businessSettings.businessLogo} 
                alt="Business Logo" 
                className="h-12 w-12 object-contain rounded-lg"
                onError={(e) => {
                  e.target.style.display = "none";
                }}
              />
            ) : (
              <span className="text-3xl">🐑</span>
            )}
            <div className="hidden sm:flex flex-col">
              <span></span>
              <span className="text-xs font-normal text-green-100">{businessSettings.businessName}</span>
            </div>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden lg:flex items-center space-x-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition duration-200 ${
                    isActive(link.href)
                      ? "bg-green-500 bg-opacity-50 font-semibold"
                      : "hover:bg-green-500 hover:bg-opacity-30"
                  }`}
                >
                  <Icon size={18} />
                  {link.label}
                </Link>
              );
            })}

            {/* Setup Dropdown */}
            <div className="relative group">
              <button
                onMouseEnter={() => setSetupOpen(true)}
                onMouseLeave={() => setSetupOpen(false)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-green-500 hover:bg-opacity-30 transition duration-200"
              >
                <FaCog size={18} />
                Setup
                <FaChevronDown size={14} className={`transition-transform ${setupOpen ? "rotate-180" : ""}`} />
              </button>

              {/* Dropdown Menu */}
              {setupOpen && (
                <div
                  onMouseEnter={() => setSetupOpen(true)}
                  onMouseLeave={() => setSetupOpen(false)}
                  className="absolute left-0 mt-0 w-48 bg-white text-gray-900 rounded-lg shadow-xl border border-green-100 py-2 z-50"
                >
                  {setupItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`block px-4 py-3 hover:bg-green-50 transition duration-150 ${
                        isActive(item.href) ? "bg-green-100 font-semibold text-green-700" : ""
                      }`}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* User Icon & Mobile Menu Toggle */}
          <div className="flex items-center gap-3">
            {/* User Avatar Dropdown (Desktop) */}
            <div className="hidden sm:block relative" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-green-500 hover:bg-opacity-30 transition duration-200 relative"
              >
                <FaUserCircle size={24} />
                {pendingTasks > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                    {pendingTasks > 9 ? "9+" : pendingTasks}
                  </span>
                )}
              </button>

              {/* User Dropdown */}
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white text-gray-900 rounded-xl shadow-2xl border border-gray-200 py-0 z-50 overflow-hidden">
                  {/* User Info Header */}
                  <div className="bg-gradient-to-r from-green-600 to-green-700 px-4 py-3 text-white">
                    <p className="font-bold text-sm">{user?.name || user?.email || "User"}</p>
                    <p className="text-xs text-green-100">{user?.role || "—"} {user?.email ? `• ${user.email}` : ""}</p>
                  </div>

                  {/* Pending Tasks */}
                  {pendingTasks > 0 && (
                    <Link
                      href="/manage/tasks"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-amber-50 transition border-b border-gray-100"
                    >
                      <FaBell className="text-amber-500" size={16} />
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{pendingTasks} Pending Task{pendingTasks > 1 ? "s" : ""}</p>
                        <p className="text-xs text-gray-500">Click to view your tasks</p>
                      </div>
                    </Link>
                  )}

                  {/* Profile / Settings link */}
                  <Link
                    href="/manage/tasks"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition border-b border-gray-100"
                  >
                    <FaClipboardList className="text-gray-400" size={16} />
                    <span className="text-sm text-gray-700">My Tasks</span>
                  </Link>

                  {/* Logout */}
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 transition text-red-600"
                  >
                    <FaSignOutAlt size={16} />
                    <span className="text-sm font-medium">Logout</span>
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <button
              className="lg:hidden p-2 hover:bg-green-500 rounded-lg transition"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="lg:hidden pb-4 space-y-2 border-t border-green-500 pt-4">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition duration-200 ${
                    isActive(link.href)
                      ? "bg-green-500 bg-opacity-50 font-semibold"
                      : "hover:bg-green-500 hover:bg-opacity-30"
                  }`}
                >
                  <Icon size={20} />
                  {link.label}
                </Link>
              );
            })}

            {/* Mobile Setup Menu */}
            <div className="border-t border-green-500 mt-2 pt-2">
              <button
                onClick={() => setMobileSetupOpen(!mobileSetupOpen)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-lg hover:bg-green-500 hover:bg-opacity-30 transition duration-200"
              >
                <span className="flex items-center gap-3">
                  <FaCog size={20} />
                  Setup
                </span>
                <FaChevronDown size={14} className={`transition-transform ${mobileSetupOpen ? "rotate-180" : ""}`} />
              </button>

              {/* Mobile Submenu */}
              {mobileSetupOpen && (
                <div className="ml-4 space-y-1 mt-2">
                  {setupItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => {
                        setIsOpen(false);
                        setMobileSetupOpen(false);
                      }}
                      className={`block px-4 py-2 rounded-lg transition duration-150 ${
                        isActive(item.href)
                          ? "bg-green-500 bg-opacity-50 font-semibold"
                          : "hover:bg-green-500 hover:bg-opacity-30"
                      }`}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => {
                handleLogout();
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-3 bg-red-600 hover:bg-red-700 px-4 py-3 rounded-lg transition duration-200 font-medium mt-2"
            >
              <FaSignOutAlt size={20} />
              Logout
            </button>

            {/* Mobile User Info */}
            {user && (
              <div className="mt-2 px-4 py-2 bg-green-800 bg-opacity-40 rounded-lg text-sm">
                <div className="flex items-center gap-2">
                  <FaUserCircle size={18} />
                  <span className="font-semibold">{user.name || user.email}</span>
                  <span className="text-xs text-green-200">({user.role})</span>
                </div>
                {pendingTasks > 0 && (
                  <Link href="/manage/tasks" onClick={() => setIsOpen(false)} className="flex items-center gap-2 mt-1 text-amber-300 text-xs">
                    <FaBell size={12} /> {pendingTasks} pending task{pendingTasks > 1 ? "s" : ""}
                  </Link>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
