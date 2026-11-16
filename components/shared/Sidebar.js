import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useRole } from "@/hooks/useRole";
import { FaChevronRight, FaUserCircle } from "react-icons/fa";
import AppIcon from "@/components/shared/AppIcon";

const ALL = ["SuperAdmin", "SubAdmin", "Manager", "Attendant"];
const MANAGERS = ["SuperAdmin", "SubAdmin", "Manager"];
const ADMIN = ["SuperAdmin"];

/**
 * The whole menu in one place. `icon` is a name from the app's icon set
 * (components/shared/AppIcon); each page's header uses the same name, so a
 * page and its menu entry always show the same icon.
 */
const MENU = [
  {
    section: "Animals",
    icon: "animals",
    roles: ALL,
    submenu: [
      { href: "/manage/animals", label: "Animal List", icon: "animals" },
      { href: "/manage/archive", label: "Archive", icon: "archive", roles: MANAGERS },
      { href: "/manage/health-records", label: "Health Records", icon: "health" },
      { href: "/manage/treatments", label: "Treatments", icon: "treatment" },
      { href: "/manage/breeding", label: "Breeding", icon: "breeding" },
      { href: "/manage/mortality", label: "Mortality", icon: "mortality" },
    ],
  },
  {
    section: "Operations",
    icon: "inventory",
    roles: ALL,
    submenu: [
      { href: "/manage/inventory", label: "Inventory", icon: "inventory" },
      { href: "/manage/inventory-categories", label: "Categories", icon: "categories", roles: MANAGERS },
      { href: "/manage/inventory-loss", label: "Losses/Wastage", icon: "loss", roles: MANAGERS },
      { href: "/manage/services", label: "Services", icon: "services", roles: MANAGERS },
      { href: "/manage/feeding", label: "Feeding", icon: "feed" },
      { href: "/manage/weight", label: "Weight Tracking", icon: "weight" },
    ],
  },
  {
    section: "Management",
    icon: "management",
    roles: ADMIN,
    submenu: [
      { href: "/manage/users", label: "Users", icon: "users", roles: ADMIN },
      { href: "/manage/roles", label: "Roles & Permissions", icon: "roles", roles: ADMIN },
    ],
  },
  {
    section: "Finance",
    icon: "finance",
    roles: MANAGERS,
    submenu: [
      { href: "/manage/transactions", label: "All Finance", icon: "finance", roles: MANAGERS },
      { href: "/manage/customers", label: "Customers", icon: "customers", roles: MANAGERS },
      { href: "/manage/orders", label: "Orders", icon: "orders", roles: MANAGERS },
      { href: "/manage/reports", label: "Reports", icon: "reports", roles: MANAGERS },
    ],
  },
  {
    section: "Setup",
    icon: "setup",
    roles: ADMIN,
    submenu: [
      { href: "/manage/locations", label: "Locations", icon: "location", roles: ADMIN },
      { href: "/manage/business-setup", label: "Business Setup", icon: "business", roles: ADMIN },
      { href: "/manage/blog", label: "Blog Management", icon: "blog", roles: ADMIN },
      { href: "/manage/seed", label: "Seed Database", icon: "seed", roles: ADMIN },
    ],
  },
];

// Shared look for every item in the rail.
const RAIL_ITEM =
  "relative w-full px-0.5 py-3 flex flex-col items-center justify-center gap-1.5 text-[11px] cursor-pointer border-l-4 rounded-r-lg transition-all duration-200";
const RAIL_IDLE =
  "text-gray-600 border-transparent hover:bg-green-50 hover:text-green-700 hover:border-green-500";
const RAIL_ACTIVE =
  "text-white font-semibold bg-gradient-to-r from-green-600 to-green-700 border-green-900 shadow-md hover:from-green-700 hover:to-green-800";

export default function Sidebar() {
  const [openMenu, setOpenMenu] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const router = useRouter();
  const { pathname } = router;
  const railRef = useRef(null);
  const submenuRef = useRef(null);
  const notifRef = useRef(null);
  const { user, isLoading } = useRole();

  const toggleMenu = (menu) => {
    setShowNotifDropdown(false);
    setOpenMenu(openMenu === menu ? null : menu);
  };

  const closeMenu = () => setOpenMenu(null);

  // Close the submenu when clicking outside it. Clicks on the rail are left to
  // the rail buttons, so pressing an open section closes it instead of
  // closing-then-reopening.
  useEffect(() => {
    if (!openMenu) return;

    const handleClickOutside = (event) => {
      const inSubmenu = submenuRef.current && submenuRef.current.contains(event.target);
      const inRail = railRef.current && railRef.current.contains(event.target);
      if (!inSubmenu && !inRail) setOpenMenu(null);
    };
    const handleEscape = (event) => {
      if (event.key === "Escape") setOpenMenu(null);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
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

  // Close notification panel when clicking outside or pressing Escape
  useEffect(() => {
    if (!showNotifDropdown) return;

    const handleClickOutsideNotif = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifDropdown(false);
      }
    };
    const handleEscape = (event) => {
      if (event.key === "Escape") setShowNotifDropdown(false);
    };

    document.addEventListener("mousedown", handleClickOutsideNotif);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutsideNotif);
      document.removeEventListener("keydown", handleEscape);
    };
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

  const renderMenuItem = (href, icon, label) => {
    const isActive = pathname === href;
    return (
      <li key={href}>
        <Link
          href={href}
          onClick={closeMenu}
          aria-current={isActive ? "page" : undefined}
          className={`${RAIL_ITEM} ${isActive ? RAIL_ACTIVE : RAIL_IDLE}`}
        >
          <AppIcon name={icon} className="w-5 h-5" />
          <span className="font-medium text-center leading-none tracking-tight">{label}</span>
        </Link>
      </li>
    );
  };

  const renderSubMenu = (items) =>
    items.map(({ href, label, icon }) => {
      const isActive = pathname === href;
      return (
        <li key={href} className="border-b border-gray-100 last:border-b-0">
          <Link
            href={href}
            onClick={closeMenu}
            aria-current={isActive ? "page" : undefined}
            className={`w-full h-14 px-4 flex items-center gap-3 text-sm font-medium border-l-4 transition-all duration-200 ${
              isActive
                ? "bg-gradient-to-r from-green-50 to-transparent border-green-600 text-green-700"
                : "text-gray-700 border-transparent hover:bg-green-50 hover:text-green-700"
            }`}
          >
            {/* Every row has the same fixed-width icon slot, so all labels line up. */}
            <span
              className={`w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-lg ${
                isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
              }`}
            >
              <AppIcon name={icon} className="w-4 h-4" />
            </span>
            <span className="flex-1 truncate">{label}</span>
            {isActive && <FaChevronRight className="w-3 h-3 text-green-600" aria-hidden="true" />}
          </Link>
        </li>
      );
    });

  // Filter menu based on user role
  const menuStructure =
    !user || isLoading
      ? []
      : MENU.filter((menu) => !menu.roles || menu.roles.includes(user.role))
          .map((menu) => ({
            ...menu,
            submenu: menu.submenu.filter((item) => !item.roles || item.roles.includes(user.role)),
          }))
          .filter((menu) => menu.submenu.length > 0);

  const openSection = menuStructure.find((m) => m.section === openMenu);

  return (
    <>
      {/* Sidebar Navigation */}
      <aside
        ref={railRef}
        className="w-20 bg-gradient-to-b from-white via-gray-50 to-gray-100 border-r-2 border-gray-200 shadow-lg flex-shrink-0 h-full flex flex-col"
      >
        {/* Menu: scrolls on its own if the screen is short */}
        <nav className="flex-1 min-h-0 overflow-y-auto pt-4 pb-2" aria-label="Main">
          <ul className="space-y-1 pr-1">
            {/* Home - hidden for Attendants */}
            {user?.role !== "Attendant" && renderMenuItem("/", "home", "Home")}

            {/* Tasks - Prominent Quick Access */}
            {renderMenuItem("/manage/tasks", "tasks", "Tasks")}

            {/* Record Expense - Quick Access (Finance roles only) */}
            {MANAGERS.includes(user?.role) && renderMenuItem("/manage/expenses", "expense", "Expense")}

            {/* Sections with a fly-out submenu */}
            {menuStructure.map(({ section, icon, submenu }) => {
              const isActive = submenu.some((item) => pathname === item.href);
              const isOpen = openMenu === section;

              return (
                <li key={section}>
                  <button
                    type="button"
                    onClick={() => toggleMenu(section)}
                    title={section}
                    aria-expanded={isOpen}
                    aria-haspopup="true"
                    className={`${RAIL_ITEM} ${isActive ? RAIL_ACTIVE : RAIL_IDLE} ${
                      isOpen && !isActive ? "bg-green-50 text-green-700 border-green-500" : ""
                    }`}
                  >
                    <AppIcon name={icon} className="w-5 h-5" />
                    <span className="font-medium text-center leading-none tracking-tight">
                      {section.split(" ")[0]}
                    </span>
                    {/* Small marker that this item opens a submenu; kept out of the
                        label's line so long names like "Management" still fit. */}
                    <FaChevronRight
                      aria-hidden="true"
                      className={`absolute right-1 top-3.5 w-2 h-2 opacity-60 transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`}
                    />
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User & Notifications: pinned to the bottom, never overlaps the menu */}
        <div className="flex-shrink-0 p-2 border-t border-gray-200" ref={notifRef}>
          <button
            type="button"
            className="relative w-full h-12 flex items-center justify-center bg-green-50 hover:bg-green-100 text-green-700 rounded-lg transition-colors border-2 border-green-200"
            title={user?.name ? `${user.name} — notifications` : "Notifications"}
            aria-label="Notifications"
            aria-expanded={showNotifDropdown}
            onClick={() => {
              closeMenu();
              setShowNotifDropdown(!showNotifDropdown);
            }}
          >
            <FaUserCircle className="w-6 h-6" aria-hidden="true" />
            {notificationCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-md">
                {notificationCount > 9 ? "9+" : notificationCount}
              </span>
            )}
          </button>

          {/* Notification panel (fixed, so the rail's scrolling can't clip it) */}
          {showNotifDropdown && (
            <div className="fixed left-[5.5rem] bottom-3 w-80 max-w-[calc(100vw-6.5rem)] bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white">
                <p className="text-sm font-bold flex items-center gap-2">
                  <AppIcon name="bell" className="w-4 h-4" />
                  Notifications
                </p>
                {notificationCount > 0 && (
                  <button onClick={handleMarkAllRead} className="text-xs bg-white/20 hover:bg-white/30 px-2 py-1 rounded">
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <AppIcon name="bell" className="w-6 h-6 mb-2" />
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
      </aside>

      {/* Fly-out submenu for the open section */}
      {openSection && (
        <ul
          ref={submenuRef}
          className="fixed left-20 top-20 w-64 bg-white border-r-2 border-gray-200 max-h-[calc(100vh-80px)] shadow-2xl z-50 overflow-y-auto rounded-br-xl"
        >
          <li className="sticky top-0 bg-gradient-to-r from-green-600 to-green-700 text-white px-4 py-4 border-b-2 border-green-800 z-10 flex items-center gap-2">
            <AppIcon name={openSection.icon} className="w-4 h-4" />
            <p className="text-sm font-bold uppercase tracking-wider">{openSection.section}</p>
          </li>
          {renderSubMenu(openSection.submenu)}
        </ul>
      )}

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
