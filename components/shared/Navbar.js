import Link from "next/link";
import { useRouter } from "next/router";
import { useState, useContext } from "react";
import { FaBars, FaTimes, FaHome, FaLeaf, FaBoxes, FaUsers, FaSignOutAlt, FaCog, FaChevronDown } from "react-icons/fa";
import { BusinessContext } from "@/context/BusinessContext";

export default function Navbar() {
  const router = useRouter();
  const { businessSettings } = useContext(BusinessContext);
  const [isOpen, setIsOpen] = useState(false);
  const [setupOpen, setSetupOpen] = useState(false);
  const [mobileSetupOpen, setMobileSetupOpen] = useState(false);
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);

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
              <span>Farm Health</span>
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

          {/* Logout Button & Mobile Menu Toggle */}
          <div className="flex items-center gap-4">
            <button
              onClick={handleLogout}
              className="hidden sm:flex items-center gap-2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition duration-200 font-medium shadow-sm hover:shadow-md"
            >
              <FaSignOutAlt size={18} />
              <span className="hidden md:inline">Logout</span>
            </button>

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
          </div>
        )}
      </div>
    </nav>
  );
}
