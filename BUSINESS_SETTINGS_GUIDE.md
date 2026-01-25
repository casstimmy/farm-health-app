# Business Settings Integration Guide

## Overview
Business settings configured in the Setup page are now used throughout the entire system. Changes made in **Setup → Business Setup** automatically update all pages and components.

## 🎯 How It Works

### 1. **BusinessContext** (`context/BusinessContext.js`)
- Fetches business settings from `/api/business-settings` on app load
- Provides settings globally to all components via React Context
- Includes a `refreshSettings()` function to update settings after changes
- Default values provided if settings not found

### 2. **Global Provider** (`pages/_app.js`)
- Wraps entire app with `<BusinessProvider>`
- Makes business settings available to all pages and components
- Settings loaded once on app initialization

## 📦 Available Settings

```javascript
{
  businessName: "Your Farm Name",        // Used in headers, titles
  businessEmail: "email@farm.com",       // Contact info
  businessPhone: "+234-XXX-XXX-XXXX",    // Contact info
  businessAddress: "Farm Address",       // Contact info
  businessDescription: "Your farm...",   // About section
  currency: "NGN",                       // For money formatting
  timezone: "UTC+1"                      // For time displays
}
```

## 🔧 Using Business Settings in Components

### Import and Use Context
```javascript
import { useContext } from "react";
import { BusinessContext } from "@/context/BusinessContext";

export default function MyComponent() {
  const { businessSettings, loading, refreshSettings } = useContext(BusinessContext);

  // Access settings
  console.log(businessSettings.businessName);
  console.log(businessSettings.currency);
  
  return (
    <h1>{businessSettings.businessName}</h1>
  );
}
```

### Formatting Currency
```javascript
import { formatCurrency } from "@/utils/formatting";
import { useContext } from "react";
import { BusinessContext } from "@/context/BusinessContext";

export default function PriceDisplay({ amount }) {
  const { businessSettings } = useContext(BusinessContext);
  
  return (
    <p>{formatCurrency(amount, businessSettings.currency)}</p>
  );
}
```

## 📍 Updated Components

### Navbar (`components/shared/Navbar.js`)
- Shows business name under logo
- Format: "Farm Health" with business name subtitle

### Dashboard (`pages/index.js`)
- Page header displays business name
- Currency formatting uses business currency
- Welcome message personalized

### TopHeader (`components/shared/TopHeader.js`)
- Displays business name instead of static "Farm Health Manager"
- Updates in real-time when settings change

### Business Setup Page (`pages/manage/business-setup.js`)
- Calls `refreshSettings()` after saving
- Automatically syncs changes throughout app

## 🎨 Components Using Business Settings

| Component | Usage | Setting Used |
|-----------|-------|--------------|
| Navbar | Logo subtitle | `businessName` |
| Dashboard | Page title | `businessName` |
| TopHeader | Main title | `businessName` |
| Money Display | Currency symbol | `currency` |
| Forms | Timezone display | `timezone` |

## 💾 Persistence & Updates

### Automatic Updates
1. User edits settings in **Setup → Business Setup**
2. Click "Save Changes"
3. API updates database
4. Context `refreshSettings()` is called
5. All components re-render with new values
6. **No page refresh needed!**

### Manual Refresh (if needed)
```javascript
const { refreshSettings } = useContext(BusinessContext);

const updateMyData = async () => {
  // ... your code
  await refreshSettings(); // Forces re-fetch of settings
};
```

## 🚀 Best Practices

### 1. Always Use Context
❌ Don't hardcode business name:
```javascript
<h1>Farm Health</h1>
```

✅ Do use context:
```javascript
const { businessSettings } = useContext(BusinessContext);
<h1>{businessSettings.businessName}</h1>
```

### 2. Handle Loading State
```javascript
const { businessSettings, loading } = useContext(BusinessContext);

if (loading) return <LoadingSpinner />;

return <div>{businessSettings.businessName}</div>;
```

### 3. Use Formatting Utilities
❌ Don't manually format currency:
```javascript
<p>₦{amount.toLocaleString()}</p>
```

✅ Do use formatting utility:
```javascript
import { formatCurrency } from "@/utils/formatting";
const { businessSettings } = useContext(BusinessContext);

<p>{formatCurrency(amount, businessSettings.currency)}</p>
```

### 4. Call refreshSettings After Updates
```javascript
const handleSave = async () => {
  const res = await fetch("/api/settings", {
    method: "PUT",
    body: JSON.stringify(data)
  });
  
  if (res.ok) {
    refreshSettings(); // Sync all components
  }
};
```

## 🔄 Data Flow

```
Setup Page
    ↓
User edits settings
    ↓
API: PUT /api/business-settings
    ↓
Database updated
    ↓
refreshSettings() called
    ↓
BusinessContext state updated
    ↓
All subscribed components re-render
    ↓
App-wide changes visible immediately
```

## 📱 Dynamic Content Examples

### Example 1: Business Info Card
```javascript
import { useContext } from "react";
import { BusinessContext } from "@/context/BusinessContext";

export default function BusinessCard() {
  const { businessSettings } = useContext(BusinessContext);

  return (
    <div>
      <h2>{businessSettings.businessName}</h2>
      <p>{businessSettings.businessEmail}</p>
      <p>{businessSettings.businessPhone}</p>
      <p>{businessSettings.businessAddress}</p>
    </div>
  );
}
```

### Example 2: Currency-Aware Component
```javascript
import { useContext } from "react";
import { BusinessContext } from "@/context/BusinessContext";
import { formatCurrency } from "@/utils/formatting";

export default function TransactionList({ transactions }) {
  const { businessSettings } = useContext(BusinessContext);

  return (
    <div>
      {transactions.map(tx => (
        <div key={tx.id}>
          <span>{tx.name}</span>
          <span>{formatCurrency(tx.amount, businessSettings.currency)}</span>
        </div>
      ))}
    </div>
  );
}
```

### Example 3: Page Title with Business Name
```javascript
import { useContext } from "react";
import { BusinessContext } from "@/context/BusinessContext";

export default function ReportPage() {
  const { businessSettings } = useContext(BusinessContext);

  return (
    <>
      <h1>{businessSettings.businessName} - Monthly Report</h1>
      <p>Generated for {businessSettings.businessEmail}</p>
    </>
  );
}
```

## 🧪 Testing Business Settings

### To test the integration:

1. **Login** to the application
2. Go to **Setup → Business Setup**
3. Change the business name to something unique
4. Click **Save Changes**
5. **Check all pages**:
   - Dashboard header shows new name
   - Navbar shows new name
   - TopHeader shows new name
   - **No page refresh required!**

## 📊 Real-World Scenario

### Scenario: Multi-Farm Setup
If you have multiple farms, you can:

1. Create Location for each farm
2. Set that location's business name in settings
3. All reports/exports will use correct farm name
4. Currency can be customized per farm

Example:
```javascript
const { businessSettings } = useContext(BusinessContext);

// Generate report with business name
const reportTitle = `${businessSettings.businessName} - Monthly Report`;
const footer = `Generated by ${businessSettings.businessName}`;
```

## 🔐 Security Notes

- Settings are fetched with JWT authentication
- User must be logged in for context to work
- Settings are cached in context, not localStorage (safer)
- Sensitive info (API keys) should not be stored in settings

## 📝 Files Modified

- ✅ `context/BusinessContext.js` - New context provider
- ✅ `pages/_app.js` - Wrapped with provider
- ✅ `components/shared/Navbar.js` - Uses business name
- ✅ `components/shared/TopHeader.js` - Uses business name
- ✅ `pages/index.js` - Dashboard uses business name
- ✅ `pages/manage/business-setup.js` - Calls refreshSettings
- ✅ `utils/formatting.js` - New formatting utilities

## 🎓 Next Steps

1. Add more business fields to settings as needed
2. Create location-specific settings if needed
3. Add business logo upload
4. Create branded reports/exports
5. Add multi-language support using timezone

## 📚 Related Files

- Business Settings API: `/pages/api/business-settings/index.js`
- Business Setup Page: `/pages/manage/business-setup.js`
- Formatting Utils: `/utils/formatting.js`
- Context: `/context/BusinessContext.js`

---

**Status**: ✅ Business Settings fully integrated
**Last Updated**: 2024
**Version**: 1.0.0
