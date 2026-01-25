# Animal Management System Guide

## Overview
The Farm Health Management System includes a comprehensive animal management module that tracks complete information about each animal in your farm including detailed records, health history, and photographs.

## Animal Data Fields

### Basic Information
- **Tag ID** (Required): Unique identifier for each animal (e.g., BGM001)
- **My Notes**: Quick reference notes (e.g., "Stud male", "Mum of 2")
- **Animal Name**: Common name or nickname
- **Species**: Type of animal (Goat, Sheep, Cow, Pig, Chicken)
- **Breed**: Specific breed (e.g., Boer, Sahel, Alpine)
- **Origin**: Where the animal came from (e.g., South Africa, Local)
- **Class**: Animal classification (Stud, Female, Kid, Adult)
- **Gender**: Male (♂️) or Female (♀️)
- **Date of Birth**: Animal's birth date

### Acquisition Information
- **Acquisition Type**: How the animal was acquired
  - Bred on farm
  - Purchased
  - Imported
  - Gift
- **Acquisition Date**: Date the animal arrived
- **Sire ID**: Father's tag ID (for pedigree tracking)
- **Dam ID**: Mother's tag ID (for pedigree tracking)

### Location & Status
- **Location** (Required): Farm location where animal resides
- **Paddock/Shed**: Specific pen or building identifier
- **Status**: Current animal status
  - Alive ✓
  - Sick 🤒
  - Sold 💰
  - Dead ✗

### Weight & Recording
- **Weight (kg)**: Current weight in kilograms
- **Weight Date**: When weight was recorded
- **Recorded By**: Name of person who recorded information

### Additional Notes
Free-text field for any other relevant information about the animal.

### Photos
- Upload multiple photos per animal
- Automatic thumbnail generation for gallery view
- Full resolution images for detailed viewing
- Support for PNG, JPG, GIF formats

## How to Add a New Animal

### Step 1: Navigate to Animal Management
1. Go to **Manage → Animal Management**
2. Click the **"Add New Animal"** button

### Step 2: Fill Basic Information
1. **Tag ID** (Required): Enter unique identifier (e.g., BGM001)
2. **My Notes**: Add quick reference notes
3. **Animal Name**: Enter the animal's name
4. **Species**: Select from dropdown
5. **Breed**: Enter breed name
6. **Origin**: Specify origin
7. **Class**: Select animal class
8. **Gender**: Choose Male or Female
9. **Date of Birth**: Enter DOB using date picker

### Step 3: Fill Acquisition Information
1. **Acquisition Type**: Select how animal was acquired
2. **Acquisition Date**: Enter acquisition date
3. **Sire ID**: Enter father's tag (optional)
4. **Dam ID**: Enter mother's tag (optional)

### Step 4: Set Location & Status
1. **Location** (Required): Select from available locations
2. **Paddock/Shed**: Enter specific pen identifier
3. **Status**: Select current status

### Step 5: Record Weight & Details
1. **Weight**: Enter current weight in kg
2. **Weight Date**: Enter when weight was recorded
3. **Recorded By**: Enter your name or leave auto-filled

### Step 6: Upload Photos
1. Click the **camera icon** to select image
2. Choose image file (PNG, JPG, GIF)
3. Click **"Upload Image"** button
4. Image is automatically resized:
   - **Full**: Up to 1200×1200px for detailed viewing
   - **Thumbnail**: 400×400px for gallery display
5. Repeat to upload multiple photos
6. Remove photos using the **X** button if needed

### Step 7: Add Notes
- Enter any additional information in the notes field

### Step 8: Submit
1. Click **"Add Animal"** button
2. System validates all required fields
3. Animal record is created and appears in the animal list

## Image Upload Specifications

### Supported Formats
- **PNG**: Lossless compression, recommended for quality
- **JPG/JPEG**: Compressed format, smaller file size
- **GIF**: Animated or static images

### File Size Limits
- Maximum: 10MB per file
- Recommended: 2-5MB for faster uploads

### Image Processing
- **Full Image**: Resized to max 1200×1200px, 85% quality
- **Thumbnail**: Resized to 400×400px, 70% quality
- Aspect ratio preserved during resizing
- Automatic orientation correction

### Storage
- Images stored in `/public/uploads/animals/`
- Unique filenames with timestamps to prevent conflicts
- Accessible via `/uploads/animals/{filename}`

## Animal Data Examples

### Example 1: Imported Breeding Stud
```
Tag ID: BGM001
My Notes: Stud male
Name: Gentle Kay
Species: Goat
Breed: Boer
Origin: South Africa
Class: Stud
Gender: Male
DOB: 05/20/2023
Acquisition Type: Imported
Acquisition Date: 10/12/2024
Location: Main Goat Farm
Paddock: Isolation
Status: Alive
Notes: Good breeding potential
```

### Example 2: Local Female Animal
```
Tag ID: BGF002
My Notes: Good producer
Name: Queen
Species: Goat
Breed: Boer
Origin: Local
Class: Female
Gender: Female
DOB: 01/01/2024
Acquisition Type: Bred on farm
Acquisition Date: 01/01/2024
Sire ID: BGM001
Location: Main Goat Farm
Paddock: RP1
Status: Alive
Weight: 28.5kg
Weight Date: 01/25/2026
Recorded By: Azeezat
```

## Database Schema

### Animal Model Fields

```javascript
{
  tagId: String (required, unique),
  myNotes: String,
  name: String,
  species: String,
  breed: String,
  origin: String,
  class: String,
  gender: String,
  dob: Date,
  color: String,
  acquisitionType: String,
  acquisitionDate: Date,
  sireId: String,
  damId: String,
  status: String (default: "Alive"),
  location: ObjectId (ref: Location),
  paddock: String,
  weight: Number,
  weightDate: Date,
  recordedBy: String,
  
  // Image storage
  images: [
    {
      full: String (URL to full image),
      thumb: String (URL to thumbnail),
      uploadedAt: Date
    }
  ],
  
  // Related records
  treatmentHistory: [TreatmentRecord],
  feedingHistory: [FeedingRecord],
  weightHistory: [WeightRecord],
  vaccinationRecords: [VaccinationRecord],
  
  notes: String,
  timestamps: { createdAt, updatedAt }
}
```

## API Endpoints

### Get All Animals
```
GET /api/animals
Headers: Authorization: Bearer {token}
Response: Array of animal records
```

### Get Single Animal
```
GET /api/animals/{id}
Headers: Authorization: Bearer {token}
Response: Single animal record with all details
```

### Create Animal
```
POST /api/animals
Headers: 
  Authorization: Bearer {token}
  Content-Type: application/json
Body: Animal data object
Response: Created animal record
```

### Update Animal
```
PUT /api/animals/{id}
Headers:
  Authorization: Bearer {token}
  Content-Type: application/json
Body: Updated fields
Response: Updated animal record
```

### Delete Animal
```
DELETE /api/animals/{id}
Headers: Authorization: Bearer {token}
Response: { message: "Animal deleted" }
```

### Upload Animal Image
```
POST /api/upload
Headers:
  Authorization: Bearer {token}
  Content-Type: application/json
Body: { file: "base64_encoded_image" }
Response: { full: "url", thumb: "url", message: "success" }
```

## Permissions

### View Animals
- ✓ SuperAdmin
- ✓ Manager
- ✓ Attendant

### Create/Edit Animals
- ✓ SuperAdmin
- ✓ Manager
- ✗ Attendant (read-only)

### Delete Animals
- ✓ SuperAdmin
- ✗ Manager
- ✗ Attendant

### Upload Images
- ✓ SuperAdmin
- ✓ Manager
- ✓ Attendant

## Troubleshooting

### Image Upload Fails
**Problem**: Upload button is disabled or shows error
**Solutions**:
- Check file size (max 10MB)
- Verify file format (PNG, JPG, GIF)
- Ensure internet connection is stable
- Check browser console for specific error
- Clear browser cache and try again

### Animal Tag ID Already Exists
**Problem**: "Animal with this tagId already exists"
**Solutions**:
- Tag IDs must be unique
- Check if animal already exists in system
- Use different tag ID format

### Location Not Available
**Problem**: Location dropdown shows "No locations available"
**Solutions**:
- Create location first in Setup → Manage Locations
- Verify you have permission to create locations
- Refresh page to reload location list

### Images Not Displaying
**Problem**: Uploaded images show as broken links
**Solutions**:
- Check if `/public/uploads/animals/` directory exists
- Verify write permissions on uploads directory
- Clear browser cache
- Re-upload images

## Best Practices

1. **Unique Tag IDs**: Use consistent naming convention (e.g., BGMXXX for Boer male)
2. **Complete Records**: Fill all available fields for better tracking
3. **Regular Photos**: Upload clear, well-lit photos for identification
4. **Consistent Names**: Use same naming convention across farm
5. **Record Dates**: Always record when measurements/observations were made
6. **Parentage**: Track sire/dam for genetic records and breeding plans
7. **Status Updates**: Keep status current (alive, sold, dead)
8. **Weight Tracking**: Record weight regularly for growth monitoring

## Seeding Sample Data

To seed the database with sample animal data:

```bash
# Windows
node seeders/seed-farm-data.js

# Linux/Mac
node seeders/seed-farm-data.js
```

Sample animals include:
- BGM001: Gentle Kay (Boer stud male)
- BGF001: Wisdom (Boer breeding female)
- SGF001: Sahel breed female
- BGF002: Boer breeding female
- BGKM001: Male kid (3 days old)
- BGKF001: Female kid (3 days old)
- BGWM001: Male kid (5 days old)

Each includes treatment history and complete information.

## Related Features

- **Health Records**: Track treatments, vaccinations, and medical history
- **Weight Tracking**: Monitor growth progression over time
- **Feeding Records**: Log daily feeding and consumption
- **Location Management**: Create and manage farm locations
- **User Management**: Control who can view/edit animal records

## Support

For issues or feature requests related to animal management, please check the main README.md or contact the development team.
