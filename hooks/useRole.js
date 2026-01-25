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
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    
    if (!userData) {
      setIsLoading(false);
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
    } catch (error) {
      console.error('Failed to parse user data:', error);
    } finally {
      setIsLoading(false);
    }
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
  const isManager = () => user?.role === 'Manager';
  const isAttendant = () => user?.role === 'Attendant';

  return {
    user,
    isLoading,
    hasRole,
    canAccess,
    isAdmin,
    isManager,
    isAttendant,
  };
}

/**
 * Helper to check if a menu item should be visible based on user role
 */
export const menuItemVisibility = {
  // SuperAdmin: Full access to everything
  SuperAdmin: ['animals', 'operations', 'management', 'finance', 'setup', 'health-records', 'treatments', 'inventory', 'feeding', 'weight', 'users', 'roles', 'transactions', 'reports', 'locations', 'business-setup'],
  
  // Manager: Can manage animals, operations, transactions, and view reports
  Manager: ['animals', 'operations', 'finance', 'setup', 'health-records', 'treatments', 'inventory', 'feeding', 'weight', 'transactions', 'reports', 'locations'],
  
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
