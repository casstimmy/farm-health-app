import { useRouter } from 'next/router';
import { useRole } from '@/hooks/useRole';

/**
 * HOC to protect pages based on user role
 * Usage:
 * export default withRoleProtection(YourComponent, ['SuperAdmin', 'Manager']);
 */
export function withRoleProtection(Component, allowedRoles = []) {
  return function ProtectedComponent(props) {
    const router = useRouter();
    const { user, isLoading } = useRole();

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

    // Check if user is authenticated
    if (!user) {
      router.push('/login');
      return null;
    }

    // Check if user has required role
    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
      router.push('/');
      return null;
    }

    return <Component {...props} />;
  };
}

/**
 * Hook to enforce role-based page access
 * Usage:
 * const { canAccess, user } = usePageAccess(['SuperAdmin', 'Manager']);
 */
export function usePageAccess(allowedRoles = []) {
  const router = useRouter();
  const { user, isLoading } = useRole();

  // Redirect if not authenticated
  if (!isLoading && !user) {
    router.push('/login');
  }

  // Redirect if role not allowed
  if (!isLoading && user && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    router.push('/');
  }

  return {
    user,
    isLoading,
    canAccess: !isLoading && user && (allowedRoles.length === 0 || allowedRoles.includes(user.role))
  };
}
