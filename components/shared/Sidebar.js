import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useRole, canAccessMenuItem } from "@/hooks/useRole";
import {
  FaHome,
  FaLeaf,
  FaBoxes,
  FaUsers,
  FaChartLine,
  FaCog,
  FaChevronRight,
  FaSpinner,
  FaStethoscope,
  FaMoneyBill,
  FaClipboard,
  FaTasks,
  FaReceipt,
  FaUserCircle,
} from "react-icons/fa";

export default function Sidebar() {
  const [openMenu, setOpenMenu] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const router = useRouter();
  const { pathname } = router;
  const submenuRef = useRef(null);
  const notifRef = useRef(null);
  const { user, isLoading } = useRole();

  const toggleMenu = (menu) => {
    setOpenMenu(openMenu === menu ? null : menu);
  };

  const closeMenu = () => setOpenMenu(null);

  // Close submenu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (submenuRef.current && !submenuRef.current.contains(event.target)) {
        closeMenu();
      }
    };

    if (openMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [openMenu]);

  useEffect(() => {
    const handleStart = () => setLoading(true);
    const handleStop = () => setLoading(false);

    router.events.on("routeChangeStart", handleStart);
    router.events.on("routeChangeComplete", handleStop);
    router.events.on("routeChangeError", handleStop);

    return () => {
      router.events.off("routeChangeStart", handleStart);
      router.events.off("routeChangeComplete", handleStop);
      router.events.off("routeChangeError", handleStop);
    };
  }, [router]);

  // Fetch notifications for badge
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token || !user) return;
        const res = await fetch("/api/notifications?unreadOnly=true", { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const data = await res.json();
          setNotificationCount(data.unreadCount || 0);
          setNotifications(data.notifications || []);
        }
      } catch { /* ignore */ }
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user]);

  // Close notification dropdown when clicking outside
  useEffect(() => {
    const handleClickOutsideNotif = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifDropdown(false);
      }
    };
    if (showNotifDropdown) {
      document.addEventListener("mousedown", handleClickOutsideNotif);
      return () => document.removeEventListener("mousedown", handleClickOutsideNotif);
    }
  }, [showNotifDropdown]);

  const handleMarkAllRead = async () => {
    try {
      const token = localStorage.getItem("token");
      await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ markAllRead: true }),
      });
      setNotificationCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch { /* ignore */ }
  };

  const handleNotifClick = (notif) => {
    setShowNotifDropdown(false);
    if (notif.link) {
      router.push(notif.link);
    }
  };

  const baseLink =
    "px-2 py-3.5 text-gray-600 transition-all duration-300 hover:bg-green-50 hover:text-green-600 flex items-center justify-center flex-col text-xs cursor-pointer border-l-4 border-transparent hover:border-green-500 rounded-r-lg";
  const activeLink =
    "px-2 py-3.5 text-white bg-gradient-to-r from-green-600 to-green-700 flex items-center justify-center flex-col text-xs cursor-pointer font-semibold border-l-4 border-green-900 transition-all duration-300 shadow-md rounded-r-lg hover:from-green-700 hover:to-green-800";

  const renderMenuItem = (href, icon, label) => (
    <li key={href} className={pathname === href ? activeLink : baseLink}>
      <Link href={href} onClick={closeMenu}>
        <div className="flex flex-col items-center justify-center gap-1">
          {icon}
          <span className="text-xs font-medium text-center">{label}</span>
        </div>
      </Link>
    </li>
  );

  const renderSubMenu = (items) =>
    items.map(({ href, label, icon, indent = false }) => {
      const isActive = pathname === href;
      return (
        <li
          key={href}
          className="border-b border-gray-100 last:border-b-0 transition-all duration-300 group"
          onClick={closeMenu}
        >
          <Link
            href={href}
            className={`w-full h-14 flex items-center gap-3 text-sm font-medium transition-all duration-300 ${
              indent ? "px-8 py-3" : "px-4 py-3"
            } ${
              isActive
                ? "bg-gradient-to-r from-green-50 to-transparent border-l-4 border-green-600 text-green-700 shadow-sm"
                : "text-gray-700 hover:bg-green-50 hover:text-green-600 border-l-4 border-transparent"
            }`}
          >
            {icon && <span className="w-4 h-4 flex-shrink-0">{icon}</span>}
            <span className="flex-1">{label}</span>
            {isActive && <span className="text-green-600 text-lg font-bold">›</span>}
          </Link>
        </li>
      );
    });

  const fullMenuStructure = [
    { section: "Main", items: [] },
    {
      section: "Animals",
      icon: <FaLeaf className="w-5 h-5" />,
      roles: ['SuperAdmin', 'SubAdmin', 'Manager', 'Attendant'],
      submenu: [
        { href: "/manage/animals", label: "Animal List", icon: <FaLeaf className="w-4 h-4" /> },
        { href: "/manage/archive", label: "📦 Archive", icon: null, roles: ['SuperAdmin', 'SubAdmin', 'Manager'] },
        { href: "/manage/health-records", label: "Health Records", icon: <FaStethoscope className="w-4 h-4" />, roles: ['SuperAdmin', 'SubAdmin', 'Manager', 'Attendant'] },
        { href: "/manage/treatments", label: "Treatments", icon: <FaClipboard className="w-4 h-4" />, roles: ['SuperAdmin', 'SubAdmin', 'Manager', 'Attendant'] },
        { href: "/manage/breeding", label: "💕 Breeding", icon: null, roles: ['SuperAdmin', 'SubAdmin', 'Manager', 'Attendant'] },
        { href: "/manage/mortality", label: "📊 Mortality", icon: null, roles: ['SuperAdmin', 'SubAdmin', 'Manager', 'Attendant'] },
      ],
    },
    {
      section: "Operations",
      icon: <FaBoxes className="w-5 h-5" />,
      roles: ['SuperAdmin', 'SubAdmin', 'Manager', 'Attendant'],
      submenu: [
        { href: "/manage/inventory", label: "Inventory", icon: <FaBoxes className="w-4 h-4" />, roles: ['SuperAdmin', 'SubAdmin', 'Manager', 'Attendant'] },
        { href: "/manage/inventory-categories", label: "Categories", icon: <FaClipboard className="w-4 h-4" />, roles: ['SuperAdmin', 'SubAdmin', 'Manager'] },
        { href: "/manage/inventory-loss", label: "Losses/Wastage", icon: <FaClipboard className="w-4 h-4" />, roles: ['SuperAdmin', 'SubAdmin', 'Manager'] },
        { href: "/manage/services", label: "🛠️ Services", icon: null, roles: ['SuperAdmin', 'SubAdmin', 'Manager'] },
        { href: "/manage/feeding", label: "Feeding", icon: <FaLeaf className="w-4 h-4" />, roles: ['SuperAdmin', 'SubAdmin', 'Manager', 'Attendant'] },
        { href: "/manage/weight", label: "Weight Tracking", icon: <FaChartLine className="w-4 h-4" />, roles: ['SuperAdmin', 'SubAdmin', 'Manager', 'Attendant'] },
      ],
    },
    {
      section: "Management",
      icon: <FaUsers className="w-5 h-5" />,
      roles: ['SuperAdmin', 'SubAdmin'],
      submenu: [
        { href: "/manage/users", label: "Users", icon: <FaUsers className="w-4 h-4" />, roles: ['SuperAdmin', 'SubAdmin'] },
        { href: "/manage/roles", label: "Roles & Permissions", icon: <FaCog className="w-4 h-4" />, roles: ['SuperAdmin'] },
      ],
    },
    {
      section: "Finance",
      icon: <FaMoneyBill className="w-5 h-5" />,
      roles: ['SuperAdmin', 'SubAdmin', 'Manager', 'Attendant'],
      submenu: [
        { href: "/manage/transactions", label: "All Finance", icon: <FaMoneyBill className="w-4 h-4" />, roles: ['SuperAdmin', 'SubAdmin', 'Manager'] },
        { href: "/manage/customers", label: "Customers", icon: <FaUsers className="w-4 h-4" />, roles: ['SuperAdmin', 'SubAdmin', 'Manager'] },
        { href: "/manage/orders", label: "Orders", icon: <FaClipboard className="w-4 h-4" />, roles: ['SuperAdmin', 'SubAdmin', 'Manager'] },
        { href: "/manage/reports", label: "Reports", icon: <FaChartLine className="w-4 h-4" />, roles: ['SuperAdmin', 'SubAdmin', 'Manager'] },
      ],
    },
    {
      section: "Setup",
      icon: <FaCog className="w-5 h-5" />,
      roles: ['SuperAdmin', 'SubAdmin', 'Manager'],
      submenu: [
        { href: "/manage/locations", label: "📍 Locations", icon: null, roles: ['SuperAdmin', 'SubAdmin', 'Manager'] },
        { href: "/manage/business-setup", label: "🏢 Business Setup", icon: null, roles: ['SuperAdmin', 'SubAdmin', 'Manager'] },
        { href: "/manage/blog", label: "Blog Management", icon: <FaClipboard className="w-4 h-4" />, roles: ['SuperAdmin', 'SubAdmin', 'Manager'] },
        { href: "/manage/seed", label: "🌱 Seed Database", icon: null, roles: ['SuperAdmin'] },
      ],
    },
  ];

  // Filter menu based on user role
  const getVisibleMenuStructure = () => {
    if (!user || isLoading) return [];
    
    return fullMenuStructure
      .filter(menu => !menu.roles || menu.roles.includes(user.role))
      .map(menu => ({
        ...menu,
        submenu: (menu.submenu || []).filter(item => !item.roles || item.roles.includes(user.role))
      }))
      .filter(menu => menu.submenu && menu.submenu.length > 0); // Remove empty menu sections
  };

  const menuStructure = getVisibleMenuStructure();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  return (
    <>
      {/* Sidebar Navigation */}
      <aside className="w-20 bg-gradient-to-b from-white via-gray-50 to-gray-100 border-r-2 border-gray-200 shadow-lg flex-shrink-0 h-full overflow-y-auto">
        <nav className="mt-6">
          <ul className="space-y-1">
            {/* Home - hidden for Attendants */}
            {user?.role !== "Attendant" && renderMenuItem("/", <FaHome className="w-5 h-5" />, "Home")}

            {/* Tasks - Prominent Quick Access */}
            {renderMenuItem("/manage/tasks", <FaTasks className="w-5 h-5" />, "Tasks")}

            {/* Record Expense - Quick Access */}
            {renderMenuItem("/manage/expenses", <FaReceipt className="w-5 h-5" />, "Expense")}

            {/* Dynamic Menu Items */}
            {menuStructure.map(({ section, icon, submenu }) => {
              if (!submenu) return null;

              // Check if any submenu item matches the current pathname
              const isActive = submenu.some((item) => pathname === item.href);

              return (
                <li key={section} className="relative">
                  <div
                    className={isActive ? activeLink : baseLink}
                    onClick={() => toggleMenu(section)}
                    title={section}
                  >
                    <div
                      className="flex flex-col items-center justify-center cursor-pointer gap-1 w-full"
                    >
                      {icon}
                      <span className="text-xs font-medium text-center">
                        {section.split(" ")[0]}
                      </span>
                      <FaChevronRight
                        className={`w-3 h-3 transition-transform duration-300 ${
                          openMenu === section ? "rotate-90" : ""
                        }`}
                      />
                    </div>
                  </div>

                  {/* Submenu */}
                  {openMenu === section && (
                    <ul
                      ref={submenuRef}
                      className="fixed left-20 top-20 w-64 bg-white border-r-2 border-gray-200 max-h-[calc(100vh-80px)] shadow-2xl z-50 overflow-y-auto"
                    >
                      {/* Section Header */}
                      <div className="sticky top-0 bg-gradient-to-r from-green-600 to-green-700 text-white px-4 py-4 border-b-2 border-green-800 z-10">
                        <p className="text-sm font-bold uppercase tracking-wider">{section}</p>
                      </div>

                      {/* Submenu Items */}
                      {renderSubMenu(submenu)}
                    </ul>
                  )}
                </li>
              );
            })}

            {/* User & Notifications */}
            <li className="absolute bottom-4 left-2 right-2 space-y-2" ref={notifRef}>
              {/* User Icon with notification badge */}
              <div className="relative">
                <div
                  className="w-16 h-12 flex items-center justify-center bg-green-50 hover:bg-green-100 text-green-700 rounded-lg transition-all duration-300 border-2 border-green-200 cursor-pointer relative"
                  title={user?.name || "User"}
                  onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                >
                  <FaUserCircle className="w-6 h-6" />
                  {notificationCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-md animate-pulse">
                      {notificationCount > 9 ? "9+" : notificationCount}
                    </span>
                  )}
                </div>

                {/* Notification Dropdown */}
                {showNotifDropdown && (
                  <div className="absolute left-full bottom-0 ml-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 max-h-96 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white">
                      <p className="text-sm font-bold">Notifications</p>
                      {notificationCount > 0 && (
                        <button onClick={handleMarkAllRead} className="text-xs bg-white/20 hover:bg-white/30 px-2 py-1 rounded">
                          Mark all read
                        </button>
                      )}
                    </div>
                    <div className="max-h-72 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="text-center py-8 text-gray-400">
                          <p className="text-sm">No notifications</p>
                        </div>
                      ) : (
                        notifications.slice(0, 15).map((notif) => (
                          <div
                            key={notif._id}
                            className={`px-4 py-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                              !notif.isRead ? "bg-blue-50/50" : ""
                            }`}
                            onClick={() => handleNotifClick(notif)}
                          >
                            <p className={`text-sm ${!notif.isRead ? "font-semibold text-gray-900" : "text-gray-700"}`}>
                              {notif.title}
                            </p>
                            {notif.message && (
                              <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notif.message}</p>
                            )}
                            <p className="text-[10px] text-gray-400 mt-1">
                              {new Date(notif.createdAt).toLocaleString()}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </li>
          </ul>
        </nav>
      </aside>

      {/* Loading Indicator */}
      {loading && (
        <div className="fixed inset-0 bg-white/75 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-green-600"></div>
            <p className="text-sm font-medium text-gray-600">Loading...</p>
          </div>
        </div>
      )}
    </>
  );
}

