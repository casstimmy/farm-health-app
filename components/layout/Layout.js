import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import TopHeader from "@/components/shared/TopHeader";
import Sidebar from "@/components/shared/Sidebar";
import Loader from "@/components/Loader";

/**
 * Main Layout Component
 * 
 * Provides consistent layout structure for authenticated pages with:
 * - Fixed TopHeader (top navigation)
 * - Fixed Sidebar (left navigation)
 * - Scrollable main content area
 * - Authentication protection
 * - Loading states
 * 
 * Usage:
 * <Layout title="Page Title">
 *   <YourContent />
 * </Layout>
 */
export default function Layout({ children, title = "Dashboard", showNav = true }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // 🔐 Check authentication on mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    if (!token || !userData) {
      // Not authenticated, redirect to login
      router.push("/login");
      setIsLoading(false);
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      setIsAuthenticated(true);
    } catch (error) {
      console.error("Failed to parse user data:", error);
      router.push("/login");
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  // 🔄 Show loader while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-gray-50 to-gray-100">
        <div className="text-center">
          <div className="animate-spin inline-block mb-4">
            <div className="w-16 h-16 border-4 border-gray-200 border-t-green-600 rounded-full"></div>
          </div>
          <p className="text-gray-700 font-semibold text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  // 🔐 Redirect if not authenticated
  if (!isAuthenticated || !user) {
    return null;
  }

  // 🔓 Render authenticated layout
  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-white via-gray-50 to-gray-100">
      {/* Fixed TopHeader - 80px height */}
      {showNav && <TopHeader userName={user.name} userRole={user.role} />}

      {/* Container for Sidebar + Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Fixed Sidebar - 80px width */}
        {showNav && <Sidebar />}

        {/* Main Content Area - Takes remaining space */}
        <main className="flex-1 overflow-y-auto px-6 py-8 md:px-12 md:py-12 lg:px-16 lg:py-16 bg-gradient-to-br from-gray-50 via-white to-gray-100">
          {/* Content Container */}
          <div>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
