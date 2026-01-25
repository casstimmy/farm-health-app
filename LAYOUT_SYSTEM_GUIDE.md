# Layout System Implementation Guide

## Overview

A flexible, reusable layout system has been created for your Farm Health Management System. The system handles:

- **Authentication protection** - Automatic redirects to login
- **Multiple layout types** - Different layouts for different page types
- **Responsive design** - Mobile and desktop support
- **Loading states** - Proper loading indicators
- **Consistent navigation** - TopHeader and Sidebar always available

## Files Created

```
components/layout/
├── Layout.js          - Main authenticated layout with navigation
├── AuthLayout.js      - Simple layout for login/register pages
└── EmptyLayout.js     - Full-width layout without navigation
```

## How It Works

### 1. **Layout.js** - Main Application Layout

```javascript
import Layout from '@/components/layout/Layout';

// In your authenticated pages:
export default function Dashboard() {
  return (
    <Layout title="Dashboard">
      <YourContent />
    </Layout>
  );
}
```

**Features:**
- ✓ Checks authentication automatically
- ✓ Redirects to login if not authenticated
- ✓ Shows loading spinner while checking
- ✓ Includes TopHeader and Sidebar
- ✓ Scrollable main content area
- ✓ Responsive margins for mobile/desktop

### 2. **AuthLayout.js** - Login/Register Pages

```javascript
import AuthLayout from '@/components/layout/AuthLayout';

// In your auth pages:
export default function Login() {
  return (
    <AuthLayout title="Login">
      <LoginForm />
    </AuthLayout>
  );
}

// Then specify in page:
Login.layoutType = 'auth';
Login.layoutProps = { title: 'Login' };
```

**Features:**
- ✓ No navigation
- ✓ Centered content
- ✓ Clean, minimal design
- ✓ Gradient background
- ✓ Responsive container

### 3. **EmptyLayout.js** - Full-Width Pages

```javascript
import EmptyLayout from '@/components/layout/EmptyLayout';

// In special pages:
export default function SpecialPage() {
  return (
    <EmptyLayout>
      <FullWidthContent />
    </EmptyLayout>
  );
}

// Then specify in page:
SpecialPage.layoutType = 'empty';
```

## How to Use in Your Pages

### Step 1: Update _app.js (Already Done ✓)

The `_app.js` file has been updated to automatically detect and apply the correct layout:

```javascript
function MyApp({ Component, pageProps }) {
  const layoutType = Component.layoutType || 'default';
  
  // Automatically applies the right layout
  if (layoutType === 'auth') return <AuthLayout>{...}</AuthLayout>;
  if (layoutType === 'empty') return <EmptyLayout>{...}</EmptyLayout>;
  return <Layout>{...}</Layout>; // Default
}
```

### Step 2: Update Your Pages

For **login.js** (Already Done ✓):
```javascript
// Add at bottom of file:
Login.layoutType = 'auth';
Login.layoutProps = { title: 'Login' };
```

For **register.js** (Already Done ✓):
```javascript
// Add at bottom of file:
Register.layoutType = 'auth';
Register.layoutProps = { title: 'Create Account' };
```

For **index.js (Dashboard)** - Optional Update:

Current structure works fine, but can be simplified:
```javascript
// Option 1: Keep as is (works with Layout wrapper)
// Layout wrapper will handle auth + nav

// Option 2: Simplify to just return content
// Layout wrapper handles TopHeader, Sidebar, main container
export default function Dashboard() {
  return (
    <>
      {/* Just your dashboard content */}
      <YourContent />
    </>
  );
}

// Explicitly opt-in to default layout:
Dashboard.layoutType = 'default'; // This is the default anyway
Dashboard.layoutProps = { title: 'Dashboard' };
```

For **manage pages** (animals.js, inventory.js, users.js):

```javascript
// Top of file - Layout is automatic

export default function ManageAnimals() {
  // No need to import or render Sidebar/TopHeader
  // Layout wrapper handles it
  
  return (
    <>
      {/* Just your page content */}
      <AnimalsList />
    </>
  );
}

// Optional: Specify layout props
ManageAnimals.layoutProps = { 
  title: 'Animal Management',
  showNav: true  // Can disable nav if needed
};
```

## Layout Hierarchy

```
_app.js (MyApp)
  ↓
Choose Layout Type (auth/empty/default)
  ↓
Layout.js OR AuthLayout.js OR EmptyLayout.js
  ↓
  [TopHeader + Sidebar] (if Layout)
  [Main Content Area]
  ↓
Your Page Component (Page Content)
```

## Layout Props Reference

### Layout.js Props

```javascript
<Layout 
  title="Page Title"              // Shows as h1 in content area
  showNav={true}                  // Show/hide TopHeader & Sidebar
  children={<YourContent />}      // Your page content
/>
```

### AuthLayout.js Props

```javascript
<AuthLayout 
  title="Farm Health"             // Shows in header
  children={<LoginForm />}        // Your form content
/>
```

### EmptyLayout.js Props

```javascript
<EmptyLayout 
  className="additional-classes"  // Extra styling
  children={<Content />}          // Your content
/>
```

## Page Configuration Pattern

Each page can specify its layout type via export:

```javascript
// pages/my-page.js

export default function MyPage() {
  return <YourContent />;
}

// Configuration (optional)
MyPage.layoutType = 'default';  // or 'auth' or 'empty'
MyPage.layoutProps = {
  title: 'My Page Title',
  // other props...
};
```

## Auth Flow

```
User visits page
  ↓
Layout wrapper checks localStorage
  ↓
Found token? → Show content
  ↓
No token? → Redirect to /login
```

## Responsive Behavior

| Screen | Sidebar Width | Main Margin | Padding |
|--------|---------------|-------------|---------|
| Mobile | w-20 (80px) | ml-20 (80px) | p-4 (16px) |
| Desktop | md:w-64 (256px) | md:ml-64 (256px) | md:p-8 (32px) |

## Benefits

✅ **DRY Principle** - No repeated nav code on every page
✅ **Consistent** - All pages have same navigation
✅ **Protected** - Auth checking automatic
✅ **Flexible** - Easy to create different layouts
✅ **Clean** - Pages focus on content, not structure
✅ **Maintainable** - Update layout once, affects all pages

## Migration Checklist

- [x] Create Layout.js component
- [x] Create AuthLayout.js component
- [x] Create EmptyLayout.js component
- [x] Update _app.js with layout logic
- [x] Update login.js with layoutType
- [x] Update register.js with layoutType
- [ ] Update manage pages (optional)
- [ ] Remove duplicate TopHeader/Sidebar from pages
- [ ] Test all page types

## Common Issues & Solutions

### Issue: Page shows no content
**Solution:** Make sure your page exports content as children

### Issue: Auth not working
**Solution:** Verify localStorage has 'token' and 'user' keys

### Issue: Layout not applying
**Solution:** Check _app.js has layout logic, clear .next cache

### Issue: Styling issues
**Solution:** Clear browser cache, restart dev server

## Next Steps

1. **Test current setup** - Visit pages, verify layouts apply
2. **Update manage pages** (optional) - Remove duplicate nav code
3. **Monitor performance** - Should load faster without duplicate code
4. **Add more layouts** - Create specialized layouts as needed

## Support

See related documentation:
- `LAYOUT_FIX_SUMMARY.md` - Layout styling fixes
- `LAYOUT_GUIDE.md` - Component specifications
- `LAYOUT_DIAGRAMS.md` - Visual diagrams

---

**Status:** ✅ Ready to Use
**Created:** January 18, 2025
