import React, { useState, useEffect, useContext } from "react";
import { FaStore, FaSignOutAlt, FaBell, FaExclamationTriangle } from "react-icons/fa";
import { useRouter } from "next/router";
import { BusinessContext } from "@/context/BusinessContext";
import { useRole } from "@/hooks/useRole";

const TopHeader = ({ userName, userRole }) => {
  const router = useRouter();
  const { businessSettings } = useContext(BusinessContext);
  const { user, isLoading } = useRole();
  const [lowStockCount, setLowStockCount] = useState(0);
  const [expiringCount, setExpiringCount] = useState(0);
  const [showAlert, setShowAlert] = useState(false);
  const [alertType, setAlertType] = useState("stock"); // 'stock' or 'expiring'

  useEffect(() => {
    // Fetch low stock count periodically
    const fetchLowStockCount = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("/api/inventory", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          console.warn(`API returned status ${res.status} for /api/inventory`);
          return;
        }
        const data = await res.json();
        const inventory = Array.isArray(data) ? data : data.data || [];

        const count = inventory.filter((p) => p.quantity < (p.minStock || 10)).length;
        setLowStockCount(count);
      } catch (err) {
        console.error("Error fetching stock count:", err);
        setLowStockCount(0);
      }
    };

    fetchLowStockCount();
    // Refresh every 2 minutes
    const interval = setInterval(fetchLowStockCount, 120000);
    return () => clearInterval(interval);
  }, []);

  // Function to get initials
  const getInitials = (name) =>
    name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  return (
    <div className="flex justify-between items-center py-3 px-6 md:px-10 bg-gradient-to-r from-white via-gray-50 to-white shadow-md border-b-2 border-gray-100 h-20 flex-shrink-0">
      {/* Left Section: Logo and Text */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-green-700 rounded-xl flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow text-xl font-bold">
          🐑
        </div>
        <div className="hidden sm:block">
          <h2 className="text-gray-900 text-xl md:text-2xl font-bold tracking-tight">{businessSettings.businessName}</h2>
          <p className="text-xs text-gray-500">Livestock Management System</p>
        </div>
      </div>

      {/* Right Section: Profile and Icons */}
      <div className="flex items-center gap-4 md:gap-6">
        {/* Notification Icon with Low Stock Alert - Only for SuperAdmin and Manager */}
        {(user?.role === 'SuperAdmin' || user?.role === 'Manager') && (
          <div className="relative group">
            <button
              className="relative p-2.5 hover:bg-gray-100 rounded-xl transition-colors duration-300"
              onClick={() => {
                setShowAlert(!showAlert);
                setAlertType("stock");
              }}
              title="Low stock alerts"
            >
              <FaBell className="w-5 h-5 text-gray-600 hover:text-green-600 transition-colors" />
              {lowStockCount > 0 && (
                <span className="w-5 h-5 bg-red-500 rounded-full absolute top-0 right-0 shadow-md flex items-center justify-center text-white text-xs font-bold animate-pulse">
                  {lowStockCount > 9 ? "9+" : lowStockCount}
                </span>
              )}
            </button>

            {/* Alert Dropdown */}
            {showAlert && alertType === "stock" && lowStockCount > 0 && (
              <div className="absolute right-0 mt-3 w-72 sm:w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 p-4 sm:p-5 z-50 max-h-96 overflow-y-auto">
                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-200">
                <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center text-lg flex-shrink-0">
                  ⚠️
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 text-sm">Low Stock Alert</p>
                  <p className="text-xs text-gray-600 truncate">{lowStockCount} item(s) below minimum</p>
                </div>
              </div>
              <div className="text-xs text-gray-600 mb-4">
                <p>Items are running low on stock. Please review inventory management.</p>
              </div>
              <a
                href="/manage/inventory"
                className="inline-block w-full text-center bg-yellow-50 hover:bg-yellow-100 text-yellow-700 py-2.5 rounded-lg font-semibold transition-all text-sm border border-yellow-200 hover:border-yellow-300"
              >
                View Inventory →
              </a>
            </div>
            )}
          </div>
        )}

        {/* Profile Section */}
        <div className="flex items-center gap-3 md:gap-4 pl-4 md:pl-6 border-l-2 border-gray-200">
          {/* Profile Image or Placeholder */}
          <div className="relative group">
            <div className="w-10 h-10 flex items-center justify-center bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl shadow-md group-hover:shadow-lg transition-all text-sm font-bold">
              {getInitials(userName) || "U"}
            </div>
          </div>

          {/* User Info */}
          <div className="flex flex-col hidden sm:flex">
            <span className="text-gray-900 font-semibold text-sm">{userName || "User"}</span>
            <span className="text-xs text-gray-500 capitalize">{userRole || "user"}</span>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 text-xs md:text-sm px-3 md:px-4 py-2 rounded-lg shadow-sm transition-all duration-200 font-semibold border border-red-200 hover:border-red-300 hover:shadow-md"
          >
            <FaSignOutAlt className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default TopHeader;
