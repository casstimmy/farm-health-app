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
} from "react-icons/fa";

export default function Sidebar() {
  const [openMenu, setOpenMenu] = useState(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { pathname } = router;
  const submenuRef = useRef(null);
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
      roles: ['SuperAdmin', 'Manager', 'Attendant'],
      submenu: [
        { href: "/manage/animals", label: "Animal List", icon: <FaLeaf className="w-4 h-4" /> },
        { href: "/manage/archive", label: "📦 Archive", icon: null, roles: ['SuperAdmin', 'Manager'] },
        { href: "/manage/health-records", label: "Health Records", icon: <FaStethoscope className="w-4 h-4" />, roles: ['SuperAdmin', 'Manager', 'Attendant'] },
        { href: "/manage/treatments", label: "Treatments", icon: <FaClipboard className="w-4 h-4" />, roles: ['SuperAdmin', 'Manager', 'Attendant'] },
        { href: "/manage/breeding", label: "💕 Breeding", icon: null, roles: ['SuperAdmin', 'Manager', 'Attendant'] },
        { href: "/manage/mortality", label: "📊 Mortality", icon: null, roles: ['SuperAdmin', 'Manager', 'Attendant'] },
      ],
    },
    {
      section: "Operations",
      icon: <FaBoxes className="w-5 h-5" />,
      roles: ['SuperAdmin', 'Manager', 'Attendant'],
      submenu: [
        { href: "/manage/inventory", label: "Inventory", icon: <FaBoxes className="w-4 h-4" />, roles: ['SuperAdmin', 'Manager', 'Attendant'] },
        { href: "/manage/inventory-categories", label: "Categories", icon: <FaClipboard className="w-4 h-4" />, roles: ['SuperAdmin', 'Manager'] },
        { href: "/manage/inventory-loss", label: "Losses/Wastage", icon: <FaClipboard className="w-4 h-4" />, roles: ['SuperAdmin', 'Manager'] },
        { href: "/manage/services", label: "🛠️ Services", icon: null, roles: ['SuperAdmin', 'Manager'] },
        { href: "/manage/feeding", label: "Feeding", icon: <FaLeaf className="w-4 h-4" />, roles: ['SuperAdmin', 'Manager', 'Attendant'] },
        { href: "/manage/weight", label: "Weight Tracking", icon: <FaChartLine className="w-4 h-4" />, roles: ['SuperAdmin', 'Manager', 'Attendant'] },
      ],
    },
    {
      section: "Management",
      icon: <FaUsers className="w-5 h-5" />,
      roles: ['SuperAdmin'],
      submenu: [
        { href: "/manage/users", label: "Users", icon: <FaUsers className="w-4 h-4" />, roles: ['SuperAdmin'] },
        { href: "/manage/roles", label: "Roles & Permissions", icon: <FaCog className="w-4 h-4" />, roles: ['SuperAdmin'] },
      ],
    },
    {
      section: "Finance",
      icon: <FaMoneyBill className="w-5 h-5" />,
      roles: ['SuperAdmin', 'Manager', 'Attendant'],
      submenu: [
        { href: "/manage/expenses", label: "💸 Record Expense", icon: null, roles: ['SuperAdmin', 'Manager', 'Attendant'] },
        { href: "/manage/transactions", label: "All Finance", icon: <FaMoneyBill className="w-4 h-4" />, roles: ['SuperAdmin', 'Manager'] },
        { href: "/manage/customers", label: "Customers", icon: <FaUsers className="w-4 h-4" />, roles: ['SuperAdmin', 'Manager'] },
        { href: "/manage/orders", label: "Orders", icon: <FaClipboard className="w-4 h-4" />, roles: ['SuperAdmin', 'Manager'] },
        { href: "/manage/reports", label: "Reports", icon: <FaChartLine className="w-4 h-4" />, roles: ['SuperAdmin', 'Manager'] },
      ],
    },
    {
      section: "Setup",
      icon: <FaCog className="w-5 h-5" />,
      roles: ['SuperAdmin', 'Manager'],
      submenu: [
        { href: "/manage/locations", label: "📍 Locations", icon: null, roles: ['SuperAdmin', 'Manager'] },
        { href: "/manage/business-setup", label: "🏢 Business Setup", icon: null, roles: ['SuperAdmin', 'Manager'] },
        { href: "/manage/blog", label: "Blog Management", icon: <FaClipboard className="w-4 h-4" />, roles: ['SuperAdmin', 'Manager'] },
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
            {/* Home */}
            {renderMenuItem("/", <FaHome className="w-5 h-5" />, "Home")}

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

            {/* Logout Button */}
            <li className="absolute bottom-4 left-2 right-2">
              <button
                onClick={handleLogout}
                className="w-16 h-16 flex items-center justify-center bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-all duration-300 border-2 border-red-200 font-semibold text-xs"
                title="Logout"
              >
                📤
              </button>
            </li>
          </ul>
        </nav>
      </aside>

      {/* Loading Indicator */}
      {loading && (
        <div className="fixed inset-0 backdrop-blur-lg bg-black bg-opacity-10 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
        </div>
      )}
    </>
  );
}

