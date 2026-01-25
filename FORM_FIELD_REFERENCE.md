# 🐑 Add New Animal Form - Complete Field Reference

## Form Overview

The new Add Animal form is organized into 5 color-coded sections for easy navigation and data organization.

---

## 📋 Section 1: Basic Information (BLUE)

**Background Color**: Blue gradient (`bg-blue-50` with `border-blue-200`)

### Fields:
```
┌─ Tag ID* (REQUIRED)
│  Input: Text
│  Placeholder: "e.g., BGM001"
│  Example: BGM001, BGF001, SGF001
│
├─ My Notes
│  Input: Text
│  Placeholder: "e.g., Stud male"
│  Example: "Stud male", "Mum of 2", "Good producer"
│
├─ Animal Name
│  Input: Text
│  Placeholder: "e.g., Gentle Kay"
│  Example: "Gentle Kay", "Wisdom", "Queen"
│
├─ Species
│  Input: Dropdown select
│  Options: Goat, Sheep, Cow, Pig, Chicken
│  Default: Goat
│
├─ Breed
│  Input: Text
│  Placeholder: "e.g., Boer"
│  Example: "Boer", "Sahel", "Alpine", "Kalahari"
│
├─ Origin
│  Input: Text
│  Placeholder: "e.g., South Africa"
│  Example: "South Africa", "Local", "Kenya"
│
├─ Class
│  Input: Dropdown select
│  Options: Select Class, Stud, Female, Kid, Adult
│  Default: (empty)
│
├─ Gender
│  Input: Dropdown select
│  Options: Male ♂️, Female ♀️
│  Default: Male
│
└─ Date of Birth
   Input: Date picker
   Format: YYYY-MM-DD
   Example: 2023-05-20
```

---

## 🛒 Section 2: Acquisition Information (GREEN)

**Background Color**: Green gradient (`bg-green-50` with `border-green-200`)

### Fields:
```
┌─ Acquisition Type
│  Input: Dropdown select
│  Options:
│    - Bred on farm
│    - Purchased
│    - Imported
│    - Gift
│  Default: Bred on farm
│
├─ Acquisition Date
│  Input: Date picker
│  Format: YYYY-MM-DD
│  Example: 2024-10-12
│
├─ Sire ID (Father)
│  Input: Text
│  Placeholder: "e.g., BGM001"
│  Example: "BGM001" (parent's tag ID)
│
└─ Dam ID (Mother)
   Input: Text
   Placeholder: "e.g., BGF001"
   Example: "BGF001" (parent's tag ID)
```

---

## 📍 Section 3: Location & Status (PURPLE)

**Background Color**: Purple gradient (`bg-purple-50` with `border-purple-200`)

### Fields:
```
┌─ Location* (REQUIRED)
│  Input: Dropdown select (populated from database)
│  Options: [All created locations]
│  Example:
│    - Main Goat Farm (Lagos)
│    - Annex Farm (Ogun)
│    - Breeding Center (Osun)
│
├─ Paddock/Shed
│  Input: Text
│  Placeholder: "e.g., RP1"
│  Example: "RP1", "Isolation", "Main", "Barn A"
│
└─ Status
   Input: Dropdown select
   Options:
     - Alive ✓
     - Sick 🤒
     - Sold 💰
     - Dead ✗
   Default: Alive
```

---

## ⚖️ Section 4: Weight & Recording (ORANGE)

**Background Color**: Orange gradient (`bg-orange-50` with `border-orange-200`)

### Fields:
```
┌─ Weight (kg)
│  Input: Number input
│  Placeholder: "e.g., 25.5"
│  Step: 0.1
│  Min: 0
│  Example: 25.5, 30, 45.75
│
├─ Weight Date
│  Input: Date picker
│  Format: YYYY-MM-DD
│  Example: 2026-01-25
│
└─ Recorded By
   Input: Text
   Placeholder: "Your name"
   Auto-filled from: localStorage (current user)
   Example: "Azeezat", "John", "Fatima"
```

---

## 📝 Section 5: Additional Notes (GRAY)

**Background Color**: Gray gradient (`bg-gray-50` with `border-gray-200`)

### Fields:
```
└─ Notes
   Input: Textarea
   Placeholder: "Add any additional notes about this animal..."
   Rows: 3
   Example: 
     "Good breeding potential, excellent conformation"
     "Recovered from illness on 2024-10-17"
     "High milk production, calm temperament"
```

---

## 🖼️ Section 6: Animal Photos (INDIGO)

**Background Color**: Indigo gradient (`bg-indigo-50` with `border-indigo-200`)

### Sub-Components:

#### A. Image Selector
```
┌─ File Input (Hidden)
│  Type: file
│  Accept: image/*
│  Formats: PNG, JPG, GIF
│
└─ Upload Area (Dashed Border)
   Icon: 📷 Camera
   Text: "Click to select image"
   Subtext: "PNG, JPG, GIF up to 5MB"
   Interaction: Click anywhere to open file picker
```

#### B. Image Preview
```
┌─ Preview Container
│  Size: 128×128px
│  Border: 2px border-indigo-300
│  Rounded: lg
│  Display: Only when image selected
│  
└─ Shows: Selected image before upload
```

#### C. Upload Button
```
┌─ Button
│  Text: "Upload Image"
│  Icon: 📷 Camera
│  State: Visible only when file selected
│  Loading: Shows spinner when uploading
│  Disabled: While uploading
│  Color: bg-indigo-600 hover:bg-indigo-700
```

#### D. Uploaded Images Gallery
```
┌─ Section Title
│  Text: "Uploaded Images (count)"
│
├─ Grid Display
│  Layout: 2 columns (mobile), 3 columns (tablet)
│  Responsive: Adjusts for different screens
│
├─ Image Card
│  Size: Each image 100×96px
│  Border: 2px border-indigo-300
│  Border-radius: lg
│  Display: Thumbnail
│
└─ Remove Button (Hover)
   Icon: ✕ Times
   Color: bg-red-600
   Position: Top-right corner
   Interaction: Click to remove image from list
```

---

## ✅ Submit Section

### Button:
```
┌─ Add Animal Button
│  Type: Submit button
│  Position: Sticky at bottom
│  Size: Full width (w-full)
│  Color: Green (bg-green-600 hover:bg-green-700)
│  Icon: ✓ Check
│  Text: "Add Animal"
│
├─ Loading State
│  Icon: Spinner animation
│  Text: "Adding Animal..."
│  Disabled: true
│
└─ Disabled Conditions
   - While loading
   - If location not selected
   - While uploading image
```

---

## 📊 Form Validation

### Required Fields:
- **Tag ID** (must be unique in database)
- **Location** (must be selected from available locations)

### Auto-Validated:
- **Weight**: Must be numeric, ≥ 0
- **Dates**: Valid date format
- **Images**: File type check (image only)

### Error Messages:
- ⚠️ "Tag ID is required"
- ⚠️ "Location is required"
- ⚠️ "Please select an image first"
- ⚠️ "Animal with this tagId already exists"
- ⚠️ "Failed to upload image"

### Success Messages:
- ✓ "Image uploaded successfully!"
- ✓ "{AnimalName} has been added successfully!"

---

## 🎨 Color Coding System

| Section | Color | Hex | Purpose |
|---------|-------|-----|---------|
| Basic Info | Blue | `#e0e7ff` | Core identification |
| Acquisition | Green | `#dcfce7` | How animal acquired |
| Location | Purple | `#f3e8ff` | Where animal is |
| Weight | Orange | `#fed7aa` | Measurements |
| Notes | Gray | `#f3f4f6` | Extra info |
| Photos | Indigo | `#e0e7ff` | Media storage |

---

## 🔄 Form Data Flow

```
User Input
    ↓
[Form Component State]
    ├─ formData: All fields
    ├─ imagePreview: Selected image
    ├─ imageFile: File object
    └─ uploadingImage: Loading state
    ↓
User Uploads Image (Optional)
    ├─ Convert to Base64
    ├─ POST /api/upload
    ├─ Receive URLs
    └─ Add to images array
    ↓
User Submits Form
    ├─ Validate required fields
    ├─ POST /api/animals
    ├─ On success:
    │   └─ Show success message
    │   └─ Reset form
    │   └─ Call onSuccess callback
    └─ On error:
        └─ Show error message
```

---

## 📱 Responsive Behavior

### Mobile (xs)
- 1 column grid for fields
- Single column image gallery
- Full-width buttons

### Tablet (md)
- 2 column grid for some sections
- 2 column image gallery
- Full-width form

### Desktop (lg)
- 3 column grid for sections
- 3 column image gallery
- Optimized spacing

---

## ♿ Accessibility

- ✓ Proper label associations
- ✓ Form validation messages
- ✓ Color contrast compliance
- ✓ Keyboard navigation support
- ✓ ARIA labels where needed
- ✓ Focus indicators visible
- ✓ Error feedback

---

## 📋 Example: Complete Filled Form

```
┌─ BASIC INFORMATION
│  Tag ID: BGF002
│  My Notes: Good producer
│  Animal Name: Queen
│  Species: Goat
│  Breed: Boer
│  Origin: Local
│  Class: Female
│  Gender: Female
│  DOB: 01/01/2024
│
├─ ACQUISITION
│  Type: Bred on farm
│  Date: 01/01/2024
│  Sire ID: BGM001
│  Dam ID: (empty)
│
├─ LOCATION & STATUS
│  Location: Main Goat Farm (Lagos)
│  Paddock: RP1
│  Status: Alive
│
├─ WEIGHT & RECORDING
│  Weight: 28.5
│  Weight Date: 01/25/2026
│  Recorded By: Azeezat
│
├─ NOTES
│  "Excellent milk production, calm temperament"
│
├─ PHOTOS
│  [Photo 1] [Photo 2] [Photo 3]
│
└─ [Submit: Add Animal]
```

---

## 🚀 Ready to Use!

The form is fully functional and ready for:
- ✓ Testing with sample data
- ✓ User training
- ✓ Live operation
- ✓ Mobile and desktop use
