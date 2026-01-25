# Layout Diagrams & Visual References

## Complete Layout Visualization

```
DESKTOP VIEW (≥ 768px)
═══════════════════════════════════════════════════════════
║ TopHeader - Logo | Farm Health | Notifications | User ║ h-20
╠═════════╦════════════════════════════════════════════════╣
║ Sidebar ║ Main Content Area (Scrollable)                 ║
║         ║                                                 ║
║ Menu    ║ • Dashboard Title                              ║
║         ║ • KPI Cards (4 columns)                        ║
║ Home    ║ • Charts Section                               ║
║         ║ • Recent Activity Table                        ║
║ Animals ║                                                 ║
║ Ops     ║   [Content Scrolls Here]                       ║
║ Mgmt    ║                                                 ║
║ Finance ║                                                 ║
║         ║                                                 ║
║ [Logout]║                                                 ║
║ Button  ║                                                 ║
╚═════════╩════════════════════════════════════════════════╝
  w-64      stretch to edges with overflow-y-auto

MOBILE VIEW (< 768px)
═══════════════════════════════════════════════════════════
║ TopHeader - 🐑 | Notifications | User                  ║ h-20
╠══╦═════════════════════════════════════════════════════╣
║  ║ Main Content (Scrollable)                           ║
║  ║                                                     ║
║  ║ • Dashboard Title                                  ║
║  ║ • KPI Cards (1-2 columns)                          ║
║  ║ • Charts Section                                   ║
║  ║ • Recent Activity Table                            ║
║  ║                                                     ║
║  ║   [Content Scrolls Here]                           ║
║  ║                                                     ║
╚══╩═════════════════════════════════════════════════════╝
 w-20 (icons only)
```

## Component Positioning Matrix

| Component | Position | Top | Left | Height | Width | Z-Index | Scroll |
|-----------|----------|-----|------|--------|-------|---------|--------|
| TopHeader | fixed | 0 | 0 | h-20 (80px) | 100% | 30 | No |
| Sidebar | fixed | h-20 (80px) | 0 | calc(100vh-80px) | w-20/w-64 | 40 | No |
| Main | fixed | h-20 (80px) | w-20/w-64 | calc(100vh-80px) | calc(100%-80px/256px) | default | Yes |

## Navigation Flow

```
┌─────────────────────────────────────────────┐
│  LOGIN PAGE (No Navigation)                 │
│  - Full viewport                            │
│  - Centered form                            │
│  - No TopHeader/Sidebar                     │
└─────────────────────────────────────────────┘
              ↓ (Login Success)
┌─────────────────────────────────────────────┐
│  DASHBOARD (With Navigation)                │
│ ┌─────────────────────────────────────────┐ │
│ │ TopHeader (fixed, z-30)                 │ │
│ ├──────┬──────────────────────────────────┤ │
│ │      │ Main Content (fixed, scrollable) │ │
│ │      │ - Proper margins                 │ │
│ │ Side │ - No overlap                     │ │
│ │ bar  │ - Full height minus header      │ │
│ │      │ - Overflow handling              │ │
│ │      │                                  │ │
│ │(z-40)│ (default z-index)               │ │
│ └──────┴──────────────────────────────────┘ │
└─────────────────────────────────────────────┘
    ↓ (Click Navigation Link)
┌─────────────────────────────────────────────┐
│  MANAGE PAGE (Inventory/Animals/Users)      │
│  Same layout structure as Dashboard         │
└─────────────────────────────────────────────┘
```

## CSS Cascade Explanation

```
Global Styles (globals.css)
    ↓
_app.js (Layout wrapper)
    ↓
Page Component
    ├─ TopHeader Component
    │  └─ fixed top-0 left-0 right-0 z-30 h-20
    ├─ Sidebar Component
    │  └─ fixed top-20 left-0 w-20 md:w-64 h-[calc(100vh-80px)] z-40
    └─ Main Content
       └─ fixed top-20 left-0 right-0 bottom-0 ml-20 md:ml-64 overflow-y-auto
          └─ Inner wrapper div (space-y-8)
             ├─ Header section
             ├─ KPI Cards section
             ├─ Charts section
             ├─ Activity section
             └─ Additional content...
```

## Space Calculation Examples

### TopHeader Space
- Height: 80px (h-20)
- Always visible
- Content inside: 12px padding top+bottom (py-4) + 8px top+bottom (py-4) = 80px total

### Sidebar Space (Desktop)
- Width: 256px (w-64)
- Height: calc(100vh - 80px)
- Available: Viewport height minus TopHeader height
- Positioned: top-20 (80px from top)

### Main Content Space (Desktop)
- Top: 80px (top-20)
- Left: 256px (ml-64)
- Right: 0 (full width minus left offset)
- Bottom: 0 (full viewport height minus top)
- Available height: 100vh - 80px = remaining space for content

### Main Content Space (Mobile)
- Top: 80px (top-20)
- Left: 80px (ml-20)
- Right: 0
- Bottom: 0
- Available height: 100vh - 80px = remaining space for content

## Responsive Transition Points

```
MOBILE                  TABLET                  DESKTOP
< 768px                 768px - 1024px          > 1024px

Sidebar:                Sidebar:                Sidebar:
w-20                    w-20 → w-64             w-64

Content Margin:         Content Margin:         Content Margin:
ml-20                   ml-20 → ml-64           ml-64

Padding:                Padding:                Padding:
p-4                     p-4 → p-8               p-8

Grid Columns:           Grid Columns:           Grid Columns:
grid-cols-1             md:grid-cols-2          lg:grid-cols-4
                        lg:grid-cols-4

Font Size:              Font Size:              Font Size:
text-sm/base            text-base               text-base/lg
```

## Scroll Area Visualization

```
┌──────────────────────────────────┐
│ TopHeader (NOT SCROLLABLE)       │ 80px
├────────────────────────────────┐─┤
│                                │▲│
│  CONTENT HERE                  │ │
│  Scrolls vertically            │▼│
│                                │▼│
│  When content > viewport       │▼│
│  height, this area scrolls     │ │
│                                │ │
│                                │▼│
└────────────────────────────────┴─┘
                                   ↑
                            scrollbar appears here
                            only in main content area
```

## Component Nesting Structure

```
<div className="min-h-screen bg-gray-50">
  ┣━━ <TopHeader />
  ┃   └─ fixed top-0 left-0 right-0 z-30 h-20
  ┃      ├─ Logo/Title
  ┃      ├─ Notifications
  ┃      └─ User Profile
  ┃
  ┣━━ <Sidebar />
  ┃   └─ fixed top-20 left-0 w-20 md:w-64 z-40
  ┃      ├─ Home link
  ┃      ├─ Menu sections (collapsible)
  ┃      │  ├─ Submenu 1
  ┃      │  ├─ Submenu 2
  ┃      │  └─ Submenu items (z-50)
  ┃      └─ Logout button
  ┃
  ┗━━ <main>
      └─ fixed top-20 left-0 right-0 bottom-0 ml-20 md:ml-64
         └─ <div className="space-y-8">
            ├─ Page Header
            ├─ KPI Cards Section
            ├─ Charts Section
            ├─ Activity Section
            └─ Additional Sections
```

## Z-Index Stacking Context

```
HIGHEST (appears on top)

50  ┌─ Sidebar Submenu (absolute)
    └─ TopHeader Notifications (absolute)

40  └─ Sidebar (fixed)

30  └─ TopHeader (fixed)

20  └─ Loading Overlays
    └─ Modals

10  └─ Page Content

0   └─ Page Background

LOWEST (appears behind)
```

## Before vs After Comparison

### BEFORE (Broken Layout)
```
┌────────────────────────────┐
│ TopHeader                  │ ← Not accounting for full width
├──────┬─────────────────────┤
│      │ Content Hidden!!!   │
│      │ OVERLAPPED by nav   │ ← ml-20 mt-20 not enough
│ Side │ TEXT NOT READABLE   │
│ bar  │ BELOW NAVBAR        │
│      │                     │
└──────┴─────────────────────┘

Problem: mt-20 only adds top margin,
doesn't account for fixed positioning
```

### AFTER (Fixed Layout)
```
┌────────────────────────────┐
│ TopHeader (h-20, fixed)    │ ← Proper height specified
├──────┬─────────────────────┤
│      │ Content Visible     │
│      │ Properly Spaced     │ ← fixed top-20 ml-20/ml-64
│ Side │ EASY TO READ        │
│ bar  │ CLEAN LAYOUT        │
│      │ SCROLLS SMOOTHLY    │
└──────┴─────────────────────┘

Solution: fixed positioning + proper spacing
```

## Layout Algorithm

1. **Calculate Available Height**
   ```
   available_height = viewport_height - topheader_height
   available_height = 100vh - 80px
   ```

2. **Calculate Sidebar**
   ```
   sidebar_height = available_height
   sidebar_width = 80px (mobile) or 256px (desktop)
   sidebar_top = topheader_height = 80px
   ```

3. **Calculate Main Content**
   ```
   main_top = topheader_height = 80px
   main_left = sidebar_width = 80px or 256px
   main_width = viewport_width - sidebar_width
   main_height = available_height = 100vh - 80px
   main_scroll = overflow-y-auto
   ```

4. **Result**
   - No overlapping
   - Proper spacing
   - Independent scrolling
   - Responsive at breakpoints
