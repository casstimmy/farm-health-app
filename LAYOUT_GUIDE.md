# Layout Structure & Component Positioning Guide

## Component Architecture

### TopHeader
- **Position:** Fixed at top
- **Height:** 80px (h-20)
- **Width:** Full width (left-0 right-0)
- **Z-Index:** 30
- **Contains:** Logo, notifications, user profile
- **Styling:**
  ```css
  fixed top-0 left-0 right-0 z-30 ... h-20
  ```

### Sidebar
- **Position:** Fixed, starts below TopHeader
- **Top Position:** 80px (top-20)
- **Height:** Remaining viewport minus TopHeader (h-[calc(100vh-80px)])
- **Width:** 80px mobile / 256px desktop (w-20 / md:w-64)
- **Z-Index:** 40 (above main content)
- **Contains:** Navigation menu items with collapsible submenus
- **Styling:**
  ```css
  fixed top-20 left-0 w-20 h-[calc(100vh-80px)] ... z-40
  ```

### Main Content Container
- **Position:** Fixed (to account for fixed header/sidebar)
- **Top Position:** 80px (below TopHeader)
- **Left Position:** 80px mobile / 256px desktop (ml-20 / md:ml-64)
- **Width:** Extends to right edge (left-0 right-0 with margins)
- **Height:** Fills remaining viewport (bottom-0)
- **Scroll:** Independent overflow-y-auto
- **Z-Index:** Default (behind navigation)
- **Styling:**
  ```css
  fixed top-20 left-0 right-0 bottom-0 ml-20 md:ml-64 overflow-y-auto
  ```

## Page Layout Template

All pages with navigation follow this structure:

```jsx
<div className="min-h-screen bg-gray-50">
  {/* TopHeader - Always visible at top */}
  <TopHeader userName={user.name} userRole={user.role} />
  
  {/* Sidebar - Always visible on left */}
  <Sidebar />

  {/* Main Content - Scrollable area */}
  <main className="fixed top-20 left-0 right-0 bottom-0 ml-20 md:ml-64 overflow-y-auto p-4 md:p-8">
    <div className="space-y-8">
      {/* Page content here */}
    </div>
  </main>
</div>
```

## Spacing & Margins

### Main Content Padding
- Mobile: `p-4` (16px)
- Desktop: `md:p-8` (32px)

### Content Wrapper Spacing
- Between sections: `space-y-8` (32px vertical gap)

### Internal Component Spacing
- Cards: Uses Tailwind gap utilities
- Sections: `gap-4`, `gap-6`

## Responsive Breakpoints

### Mobile (< 768px)
```
┌──────────────────────────┐
│  TopHeader (full width)  │ 80px
├──┬──────────────────────┤
│  │                      │
│  │  Main Content        │ scrollable
│  │  (80px left margin)  │
│  │                      │
└──┴──────────────────────┘
   80px (sidebar width on mobile)
```

### Desktop (≥ 768px)
```
┌──────────────────────────────┐
│  TopHeader (full width)      │ 80px
├─────────┬────────────────────┤
│         │                    │
│ Sidebar │  Main Content      │ scrollable
│(256px)  │  (256px left mg)   │
│         │                    │
└─────────┴────────────────────┘
   80px    256px
```

## Component Order Importance

**Correct Order:**
1. TopHeader (renders first, top-0)
2. Sidebar (renders second, top-20, won't overlap header)
3. Main content (fixed, has margins for nav)

**Why order matters:**
- Z-index alone doesn't prevent layout overlap
- Fixed positioning needs proper spacing via margins
- Component order affects rendering, but CSS positioning handles visibility

## Scrolling Behavior

### What Scrolls
- Main content container only
- Content inside `<main>` scrolls when it exceeds viewport height

### What Stays Fixed
- TopHeader (always visible)
- Sidebar (always visible)
- Page padding (stays on screen)

### Scroll Performance
- Independent scrolling means smooth interactions
- Sidebar doesn't scroll, so navigation always accessible
- TopHeader stays visible for logo/notifications

## Common Issues & Solutions

### Issue: Content Hidden Under TopHeader
**Cause:** Missing top spacing or margin
**Solution:** Use `fixed top-20` and `ml-20 md:ml-64` on main

### Issue: Sidebar and Content Overlapping
**Cause:** Using just `mt-20` without left margin
**Solution:** Add both `top-20` (for top offset) AND `ml-20 md:ml-64` (for left offset)

### Issue: Content Not Scrolling
**Cause:** Missing `overflow-y-auto` on main container
**Solution:** Add `overflow-y-auto` to main element

### Issue: TopHeader Content Cuts Off
**Cause:** Missing `h-20` or insufficient height
**Solution:** Add explicit `h-20` (80px) height

## Testing Checklist

- [ ] TopHeader stays at top when scrolling
- [ ] Sidebar stays visible on left when scrolling
- [ ] Main content scrolls independently
- [ ] No horizontal scroll bar appears
- [ ] Mobile layout has correct sidebar width
- [ ] Desktop layout has correct sidebar width
- [ ] All content visible below TopHeader
- [ ] All content visible to right of Sidebar
- [ ] No overlapping components
- [ ] Responsive breakpoints work correctly

## Color & Visual Hierarchy

### TopHeader
- Background: White to gray gradient (from-white to-gray-50)
- Shadow: shadow-lg
- Border: border-b border-gray-200

### Sidebar
- Background: White to gray gradient (from-white via-gray-50 to-gray-100)
- Active items: Green gradient (from-green-600 to-green-700)
- Border: border-r-2 border-gray-200
- Shadow: shadow-lg

### Main Content Area
- Background: Light gray (bg-gray-50)
- Cards: White with subtle shadow (card, card-lg classes)
- Text: Dark gray (text-gray-900, text-gray-600)

## Z-Index Stacking

```
50  ├─ Sidebar submenus (absolute positioned)
    └─ TopHeader alerts & dropdowns
40  └─ Sidebar (fixed)
30  └─ TopHeader (fixed)
20  └─ Loading indicators
10  └─ Main content container
0   └─ Page background
```

## Performance Considerations

1. **Fixed Positioning**: CPU efficient, no constant recalculation
2. **Scrolling**: Main content only, reduces paint operations
3. **Z-Index**: Limited layering improves rendering efficiency
4. **Layout Shift**: Fixed positioning prevents CLS issues

## Accessibility Notes

- TopHeader always accessible (fixed, top)
- Navigation always accessible (sidebar fixed)
- Content remains focusable within scrollable area
- Proper contrast ratios maintained
- Semantic HTML structure preserved
