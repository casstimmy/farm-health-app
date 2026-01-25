# Role-Based Access Control (RBAC) - Complete Implementation

## Overview
Comprehensive role-based access control has been implemented across the Farm Health Management System. All pages, APIs, and features now enforce proper role-based authorization.

## User Roles

### 👑 SuperAdmin
- **Description**: Full system access and administration
- **Permissions**: All features, all CRUD operations, can manage users and roles

### 👔 Manager  
- **Description**: Can manage farm operations and view reports
- **Permissions**: Can create/edit animals, inventory, finance, treatments, and view reports

### 👷 Attendant
- **Description**: Can record data and view animal records
- **Permissions**: Can view animals and record treatments, feeding, weight data only

---

## Page Access Control

### Protected Pages (SuperAdmin Only)
- `/manage/users` - User management and role editing
- `/manage/roles` - View role permissions matrix

### Protected Pages (SuperAdmin & Manager)
- `/manage/business-setup` - Business configuration
- `/manage/locations` - Location/facility management
- `/manage/finance` - Financial management
- `/manage/transactions` - Transaction records
- `/manage/reports` - Report generation

### Protected Pages (All Authenticated Users)
- `/manage/animals` - Animal management
- `/manage/health-records` - Health record viewing
- `/manage/treatments` - Treatment records
- `/manage/inventory` - Inventory viewing (creation/edit restricted)
- `/manage/feeding` - Feeding records
- `/manage/weight` - Weight tracking

### Public Pages
- `/login` - Login page
- `/register` - Registration page (if enabled)

---

## Sidebar Menu Filtering

The sidebar dynamically shows/hides menu items based on user role:

**SuperAdmin sees:**
- Animals (full menu)
- Operations (full menu)
- Management (Users, Roles)
- Finance (Transactions, Reports)
- Setup (Locations, Business Setup)

**Manager sees:**
- Animals (full menu)
- Operations (full menu)
- Finance (Transactions, Reports)
- Setup (Locations, Business Setup)

**Attendant sees:**
- Animals (full menu)
- Operations (full menu)

---

## API Endpoint Authorization

### Users API `/api/users`
- **GET**: SuperAdmin only
- **PUT**: SuperAdmin only (with role validation)
- **DELETE**: SuperAdmin only (prevents deleting last SuperAdmin)

### Finance API `/api/finance`
- **GET**: SuperAdmin, Manager
- **POST**: SuperAdmin, Manager

### Inventory API `/api/inventory`
- **GET**: All authenticated users
- **POST**: SuperAdmin, Manager

### Animals API `/api/animals`
- **GET**: All authenticated users
- **POST**: SuperAdmin, Manager (with role check in handler)

### Operations APIs (Treatment, Feeding, Weight) `/api/treatment|feeding|weight`
- **GET**: All authenticated users
- **POST**: All authenticated users

### Locations API `/api/locations`
- **GET**: SuperAdmin, Manager
- **POST**: SuperAdmin, Manager

### Business Settings API `/api/business-settings`
- **GET**: All authenticated users
- **PUT**: SuperAdmin, Manager

---

## Features Implemented

### ✅ User Role Editing
- SuperAdmin can edit user roles in `/manage/users`
- Role change validation prevents invalid transitions
- Cannot remove the last SuperAdmin
- Real-time UI with save/cancel options
- Success/error notifications

### ✅ Page Access Control
- Automatic redirect for unauthorized access
- Loading state while checking permissions
- Graceful handling of permission changes
- Uses `useRole` hook for role checking

### ✅ API Endpoint Protection
- All endpoints enforce RBAC via middleware
- GET requests allow broader access (viewing data)
- POST/PUT/DELETE restricted to authorized roles
- Validation of role values before updates
- Error responses for unauthorized access

### ✅ Sidebar Menu Filtering
- Dynamic menu structure based on user role
- Empty sections automatically removed
- Role icons and badges displayed
- Active page highlighting

### ✅ TopHeader Notifications
- Bell icon notifications visible only to SuperAdmin & Manager
- Attendants don't see stock alerts (irrelevant to their role)

---

## Code Structure

### Custom Hook: `useRole` (hooks/useRole.js)
```javascript
const { user, isLoading, hasRole, canAccess, isAdmin, isManager, isAttendant } = useRole();
```

### Role Protection Utilities (hooks/withRoleProtection.js)
```javascript
// HOC for protecting components
export const ProtectedComponent = withRoleProtection(Component, ['SuperAdmin']);

// Hook for page access
const { user, canAccess } = usePageAccess(['SuperAdmin', 'Manager']);
```

### Usage Pattern in Pages
```javascript
import { useRole } from "@/hooks/useRole";

export default function MyPage() {
  const { user, isLoading } = useRole();

  useEffect(() => {
    if (user && !["SuperAdmin", "Manager"].includes(user.role)) {
      router.push("/");
      return;
    }
  }, [user, isLoading]);
}
```

---

## Security Best Practices Implemented

1. ✅ **Authentication Check First**: All protected pages check for valid token
2. ✅ **Role Validation on API**: All sensitive endpoints validate user role
3. ✅ **Cannot Remove Last Admin**: Prevents system lock-out
4. ✅ **Role Enum Validation**: Only valid roles accepted (SuperAdmin, Manager, Attendant)
5. ✅ **UI Reflects Backend**: Frontend restrictions match API permissions
6. ✅ **Graceful Redirects**: Users redirected to home if unauthorized
7. ✅ **Error Handling**: Clear error messages for permission violations
8. ✅ **Least Privilege**: Attendants have minimal access by default

---

## Testing Checklist

- [ ] Login as SuperAdmin - all pages accessible
- [ ] Login as Manager - finance, operations, setup accessible
- [ ] Login as Attendant - only animals & operations accessible
- [ ] Edit user role as SuperAdmin - verify UI updates
- [ ] Try unauthorized API call - verify 403 error
- [ ] Try to remove last SuperAdmin - verify error message
- [ ] Sidebar shows correct menu for each role
- [ ] Bell notification visible for SuperAdmin/Manager only
- [ ] Unauthenticated access redirects to login
- [ ] Unauthorized access redirects to home

---

## Future Enhancements

- [ ] Custom role creation (beyond the 3 predefined roles)
- [ ] Granular feature-level permissions
- [ ] Permission audit logging
- [ ] Scheduled role review reminders
- [ ] Two-factor authentication for SuperAdmin
- [ ] Role change history tracking
