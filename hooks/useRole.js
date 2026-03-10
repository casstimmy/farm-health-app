import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

/**
 * Custom hook to manage role-based access control
 * 
 * Usage:
 * const { user, hasRole, canAccess, isLoading } = useRole(['SuperAdmin', 'Manager']);
 */
export function useRole(allowedRoles = []) {
  const router = useRouter();

  // Read user from localStorage synchronously on first client render to avoid
  // an extra render cycle where user is null, which causes page flicker and
  // unnecessary API calls.
  const [user, setUser] = useState(() => {
    if (typeof window === 'undefined') return null;
    try {
      const userData = localStorage.getItem('user');
      return userData ? JSON.parse(userData) : null;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState(() => {
    if (typeof window === 'undefined') return true;
    return false; // On the client, user is already read above
  });

  // Keep user in sync if localStorage changes in another tab
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === 'user') {
        try {
          setUser(e.newValue ? JSON.parse(e.newValue) : null);
        } catch { /* ignore */ }
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const hasRole = (role) => {
    return user?.role === role;
  };

  const canAccess = (roles) => {
    if (!user) return false;
    if (!Array.isArray(roles)) return user.role === roles;
    return roles.includes(user.role);
  };

  const isAdmin = () => user?.role === 'SuperAdmin';
  const isSubAdmin = () => user?.role === 'SubAdmin';
  const isManager = () => user?.role === 'Manager';
  const isAttendant = () => user?.role === 'Attendant';

  return {
    user,
    isLoading,
    hasRole,
    canAccess,
    isAdmin,
    isSubAdmin,
    isManager,
    isAttendant,
  };
}

/**
 * Helper to check if a menu item should be visible based on user role
 */
export const menuItemVisibility = {
  // SuperAdmin: Full access to everything
  SuperAdmin: ['animals', 'operations', 'management', 'finance', 'setup', 'health-records', 'treatments', 'inventory', 'feeding', 'weight', 'users', 'roles', 'transactions', 'reports', 'locations', 'business-setup', 'customers', 'orders', 'blog'],
  
  // SubAdmin: Like Manager but location-scoped, finance with location access
  SubAdmin: ['animals', 'operations', 'finance', 'health-records', 'treatments', 'inventory', 'feeding', 'weight', 'transactions', 'reports', 'locations', 'customers', 'orders', 'blog'],
  
  // Manager: Can manage animals, operations, transactions, and view reports
  Manager: ['animals', 'operations', 'finance', 'health-records', 'treatments', 'inventory', 'feeding', 'weight', 'transactions', 'reports', 'locations', 'customers', 'orders', 'blog'],
  
  // Attendant: Can only view animals and record operations
  Attendant: ['animals', 'operations', 'health-records', 'treatments', 'inventory', 'feeding', 'weight'],
};

/**
 * Check if a user role can access a specific menu item
 */
export const canAccessMenuItem = (userRole, menuItem) => {
  const visibleItems = menuItemVisibility[userRole] || [];
  return visibleItems.includes(menuItem);
};
