export const ANIMAL_SEED_COLUMNS = [
  "tagId",
  "name",
  "species",
  "breed",
  "gender",
  "dob",
  "status",
  "currentWeight",
  "acquisitionType",
  "purchaseCost",
  "marginPercent",
  "projectedMaxWeight",
  "projectedSalesPrice",
  "locationName",
];

export const LOCATIONS_SEED_COLUMNS = ["code", "name", "description", "capacity"];
export const LOCATIONS_SEED_ROWS = [
  { code: "LOC001", name: "Main Farm", description: "Primary farm location", capacity: 500 },
  { code: "LOC002", name: "Annex Farm", description: "Secondary farm location", capacity: 300 },
];

export const INVENTORY_CATEGORIES_SEED_COLUMNS = ["code", "name", "description"];
export const INVENTORY_CATEGORIES_SEED_ROWS = [
  { code: "CAT001", name: "Feed & Fodder", description: "Animal feed and fodder" },
  { code: "CAT002", name: "Medicine", description: "Veterinary medicines" },
  { code: "CAT003", name: "Equipment", description: "Farm equipment" },
  { code: "CAT004", name: "Supplies", description: "General supplies" },
];

export const INVENTORY_ITEMS_SEED_COLUMNS = ["barcode", "item", "category", "quantity", "unit", "reorderLevel", "cost", "salesPrice"];
export const INVENTORY_ITEMS_SEED_ROWS = [
  { barcode: "INV001", item: "Grower Feed", category: "Feed & Fodder", quantity: 500, unit: "kg", reorderLevel: 100, cost: 800, salesPrice: 1000 },
  { barcode: "INV002", item: "Starter Feed", category: "Feed & Fodder", quantity: 300, unit: "kg", reorderLevel: 50, cost: 900, salesPrice: 1100 },
  { barcode: "INV003", item: "Antibiotic (500ml)", category: "Medicine", quantity: 20, unit: "bottles", reorderLevel: 5, cost: 3500, salesPrice: 4500 },
  { barcode: "INV004", item: "Vaccine (100ml)", category: "Medicine", quantity: 15, unit: "bottles", reorderLevel: 3, cost: 2500, salesPrice: 3500 },
];

export const FEED_TYPES_SEED_COLUMNS = ["code", "name", "description", "unit", "nutritionValue"];
export const FEED_TYPES_SEED_ROWS = [
  { code: "FEED001", name: "Grower Pellets", description: "High protein growth feed", unit: "kg", nutritionValue: "16% protein" },
  { code: "FEED002", name: "Maintenance Feed", description: "Regular maintenance feed", unit: "kg", nutritionValue: "12% protein" },
];

export const SERVICES_SEED_COLUMNS = ["code", "name", "description", "price", "unit"];
export const SERVICES_SEED_ROWS = [
  { code: "SVC001", name: "Veterinary Consultation", description: "Animal health consultation", price: 5000, unit: "per visit" },
  { code: "SVC002", name: "Animal Boarding", description: "Animal boarding service", price: 3000, unit: "per day" },
];

export const CUSTOMERS_SEED_COLUMNS = ["name", "phone", "email", "address", "customerType"];
export const CUSTOMERS_SEED_ROWS = [
  { name: "Ahmed Livestock Farms", phone: "+234 801 234 5678", email: "ahmed@farms.com", address: "Maiduguri", customerType: "Reseller" },
  { name: "Mallam Feeds Limited", phone: "+234 802 345 6789", email: "mallam@feeds.com", address: "Kano", customerType: "Wholesale" },
];

// ─── Additional Seed Category Defaults ───

export const TREATMENTS_SEED_COLUMNS = ["animalTagId", "date", "type", "symptoms", "diagnosis", "medicationName", "dosage", "route", "treatedBy", "notes"];
export const TREATMENTS_SEED_ROWS = [
  { animalTagId: "BGF001", date: "2024-06-15", type: "Curative", symptoms: "Loss of appetite", diagnosis: "Parasitic infection", medicationName: "Antibiotic (500ml)", dosage: "5ml", route: "Oral", treatedBy: "Dr. Musa", notes: "Follow up in 3 days" },
  { animalTagId: "BGM001", date: "2024-07-01", type: "Preventive", symptoms: "", diagnosis: "Routine deworming", medicationName: "Ivermectin", dosage: "2ml", route: "Injection", treatedBy: "Dr. Musa", notes: "Quarterly deworming" },
];

export const HEALTH_RECORDS_SEED_COLUMNS = ["animalTagId", "date", "type", "description", "performedBy", "notes"];
export const HEALTH_RECORDS_SEED_ROWS = [
  { animalTagId: "BGF001", date: "2024-05-10", type: "Check-up", description: "Routine health check — good condition", performedBy: "Dr. Musa", notes: "Healthy" },
  { animalTagId: "BGF002", date: "2024-05-10", type: "Check-up", description: "Slight limp on front left leg", performedBy: "Dr. Musa", notes: "Monitor for 1 week" },
];

export const FEEDING_RECORDS_SEED_COLUMNS = ["animalTagId", "date", "feedType", "quantity", "unit", "fedBy", "notes"];
export const FEEDING_RECORDS_SEED_ROWS = [
  { animalTagId: "BGF001", date: "2024-06-01", feedType: "Grower Pellets", quantity: 2, unit: "kg", fedBy: "Ibrahim", notes: "Morning feed" },
  { animalTagId: "BGM001", date: "2024-06-01", feedType: "Maintenance Feed", quantity: 3, unit: "kg", fedBy: "Ibrahim", notes: "Morning feed" },
];

export const WEIGHT_RECORDS_SEED_COLUMNS = ["animalTagId", "date", "weight", "unit", "recordedBy", "notes"];
export const WEIGHT_RECORDS_SEED_ROWS = [
  { animalTagId: "BGF001", date: "2024-05-01", weight: 20, unit: "kg", recordedBy: "Ibrahim", notes: "Monthly weigh-in" },
  { animalTagId: "BGF001", date: "2024-06-01", weight: 23, unit: "kg", recordedBy: "Ibrahim", notes: "Monthly weigh-in" },
  { animalTagId: "BGM001", date: "2024-05-01", weight: 42, unit: "kg", recordedBy: "Ibrahim", notes: "Monthly weigh-in" },
  { animalTagId: "BGM001", date: "2024-06-01", weight: 45, unit: "kg", recordedBy: "Ibrahim", notes: "Monthly weigh-in" },
];

export const VACCINATION_RECORDS_SEED_COLUMNS = ["animalTagId", "date", "vaccineName", "batchNumber", "dosage", "route", "administeredBy", "nextDueDate", "notes"];
export const VACCINATION_RECORDS_SEED_ROWS = [
  { animalTagId: "BGF001", date: "2024-04-01", vaccineName: "PPR Vaccine", batchNumber: "PPR-2024-001", dosage: "1ml", route: "Subcutaneous", administeredBy: "Dr. Musa", nextDueDate: "2025-04-01", notes: "Annual vaccination" },
  { animalTagId: "BGM001", date: "2024-04-01", vaccineName: "PPR Vaccine", batchNumber: "PPR-2024-001", dosage: "1ml", route: "Subcutaneous", administeredBy: "Dr. Musa", nextDueDate: "2025-04-01", notes: "Annual vaccination" },
];

export const BREEDING_RECORDS_SEED_COLUMNS = ["breedingId", "doeTagId", "buckTagId", "matingDate", "breedingType", "expectedDueDate", "pregnancyStatus", "notes"];
export const BREEDING_RECORDS_SEED_ROWS = [
  { breedingId: "BR-001", doeTagId: "BGF001", buckTagId: "BGM001", matingDate: "2024-03-15", breedingType: "Natural", expectedDueDate: "2024-08-12", pregnancyStatus: "Delivered", notes: "Healthy delivery" },
  { breedingId: "BR-002", doeTagId: "BGF002", buckTagId: "BGM002", matingDate: "2024-06-01", breedingType: "Natural", expectedDueDate: "2024-10-28", pregnancyStatus: "Confirmed", notes: "First breeding" },
];

export const MORTALITY_RECORDS_SEED_COLUMNS = ["animalTagId", "date", "cause", "symptoms", "diagnosis", "reportedBy", "notes"];
export const MORTALITY_RECORDS_SEED_ROWS = [
  { animalTagId: "SGF002", date: "2024-07-20", cause: "Disease", symptoms: "Lethargy, loss of appetite", diagnosis: "Pneumonia", reportedBy: "Ibrahim", notes: "Found dead in morning" },
];

export const FINANCIAL_TRANSACTIONS_SEED_COLUMNS = ["title", "type", "category", "amount", "date", "paymentMethod", "vendor", "description"];
export const FINANCIAL_TRANSACTIONS_SEED_ROWS = [
  { title: "Feed Purchase - June", type: "Expense", category: "Feed", amount: 150000, date: "2024-06-05", paymentMethod: "Bank Transfer", vendor: "Mallam Feeds Limited", description: "Monthly feed purchase" },
  { title: "Animal Sale - BGM005", type: "Income", category: "Animal Sales", amount: 85000, date: "2024-06-20", paymentMethod: "Cash", vendor: "Walk-in Customer", description: "Sold male goat" },
  { title: "Veterinary Services", type: "Expense", category: "Healthcare", amount: 25000, date: "2024-06-10", paymentMethod: "Cash", vendor: "Dr. Musa Clinic", description: "Quarterly health check" },
];

export const BLOG_POSTS_SEED_COLUMNS = ["title", "slug", "category", "status", "excerpt", "author"];
export const BLOG_POSTS_SEED_ROWS = [
  { title: "Getting Started with Goat Farming", slug: "getting-started-goat-farming", category: "Guide", status: "Published", excerpt: "Learn the basics of goat farming for beginners", author: "Admin" },
  { title: "Best Feed Practices for Livestock", slug: "best-feed-practices", category: "Tips", status: "Published", excerpt: "Optimize your animal feed for better growth", author: "Admin" },
];

export const DEFAULT_ANIMAL_SEED_ROWS = [
  { tagId: "BGF001", name: "Amina", species: "Goat", breed: "Boer", gender: "Female", dob: "2023-03-15", status: "Alive", currentWeight: 23, acquisitionType: "Purchased", purchaseCost: 45000, marginPercent: 30, projectedMaxWeight: 50, projectedSalesPrice: 58500, locationName: "Main Farm" },
  { tagId: "BGF002", name: "Zara", species: "Goat", breed: "Boer", gender: "Female", dob: "2023-04-20", status: "Alive", currentWeight: 20, acquisitionType: "Purchased", purchaseCost: 42000, marginPercent: 30, projectedMaxWeight: 48, projectedSalesPrice: 54600, locationName: "Main Farm" },
  { tagId: "BGF003", name: "Fatima", species: "Goat", breed: "Boer", gender: "Female", dob: "2023-05-10", status: "Alive", currentWeight: 22, acquisitionType: "Purchased", purchaseCost: 44000, marginPercent: 30, projectedMaxWeight: 50, projectedSalesPrice: "", locationName: "Main Farm" },
  { tagId: "BGF004", name: "Aisha", species: "Goat", breed: "Boer", gender: "Female", dob: "2023-06-01", status: "Alive", currentWeight: 21, acquisitionType: "Purchased", purchaseCost: 43000, marginPercent: 30, projectedMaxWeight: 49, projectedSalesPrice: "", locationName: "Main Farm" },
  { tagId: "BGF005", name: "Safiya", species: "Goat", breed: "Boer", gender: "Female", dob: "2023-07-15", status: "Alive", currentWeight: 20, acquisitionType: "Purchased", purchaseCost: 40000, marginPercent: 30, projectedMaxWeight: 47, projectedSalesPrice: "", locationName: "Annex Farm" },
  { tagId: "BGF006", name: "Maryam", species: "Goat", breed: "Boer", gender: "Female", dob: "2023-08-20", status: "Alive", currentWeight: 19, acquisitionType: "Purchased", purchaseCost: 38000, marginPercent: 30, projectedMaxWeight: 45, projectedSalesPrice: "", locationName: "Annex Farm" },
  { tagId: "BGM001", name: "Sultan", species: "Goat", breed: "Boer", gender: "Male", dob: "2022-12-10", status: "Alive", currentWeight: 45, acquisitionType: "Purchased", purchaseCost: 85000, marginPercent: 30, projectedMaxWeight: 70, projectedSalesPrice: 110500, locationName: "Main Farm" },
  { tagId: "BGM002", name: "Khalid", species: "Goat", breed: "Boer", gender: "Male", dob: "2023-02-15", status: "Alive", currentWeight: 35, acquisitionType: "Purchased", purchaseCost: 65000, marginPercent: 30, projectedMaxWeight: 65, projectedSalesPrice: "", locationName: "Main Farm" },
  { tagId: "BGM003", name: "Hassan", species: "Goat", breed: "Boer", gender: "Male", dob: "2023-04-01", status: "Alive", currentWeight: 30, acquisitionType: "Bred on farm", purchaseCost: 0, marginPercent: 30, projectedMaxWeight: 60, projectedSalesPrice: "", locationName: "Main Farm" },
  { tagId: "BGM004", name: "Bashir", species: "Goat", breed: "Boer", gender: "Male", dob: "2023-05-20", status: "Alive", currentWeight: 28, acquisitionType: "Bred on farm", purchaseCost: 0, marginPercent: 30, projectedMaxWeight: 58, projectedSalesPrice: "", locationName: "Annex Farm" },
  { tagId: "BGM005", name: "Danjo", species: "Goat", breed: "Boer", gender: "Male", dob: "2023-07-01", status: "Alive", currentWeight: 25, acquisitionType: "Bred on farm", purchaseCost: 0, marginPercent: 30, projectedMaxWeight: 55, projectedSalesPrice: "", locationName: "Annex Farm" },
  { tagId: "BGM006", name: "Ameer", species: "Goat", breed: "Boer", gender: "Male", dob: "2023-08-10", status: "Alive", currentWeight: 22, acquisitionType: "Bred on farm", purchaseCost: 0, marginPercent: 30, projectedMaxWeight: 52, projectedSalesPrice: "", locationName: "Annex Farm" },
  { tagId: "SGF001", name: "Hauwa", species: "Goat", breed: "Sahel", gender: "Female", dob: "2023-01-10", status: "Alive", currentWeight: 23, acquisitionType: "Purchased", purchaseCost: 35000, marginPercent: 25, projectedMaxWeight: 45, projectedSalesPrice: "", locationName: "Main Farm" },
  { tagId: "SGF004", name: "Binta", species: "Goat", breed: "Sahel", gender: "Female", dob: "2023-09-01", status: "Alive", currentWeight: 18, acquisitionType: "Purchased", purchaseCost: 30000, marginPercent: 25, projectedMaxWeight: 40, projectedSalesPrice: "", locationName: "Main Farm" },
  { tagId: "SGF005", name: "Nafisa", species: "Goat", breed: "Sahel", gender: "Female", dob: "2023-10-15", status: "Alive", currentWeight: 17, acquisitionType: "Purchased", purchaseCost: 28000, marginPercent: 25, projectedMaxWeight: 38, projectedSalesPrice: "", locationName: "Main Farm" },
  { tagId: "SGF006", name: "Jamila", species: "Goat", breed: "Sahel", gender: "Female", dob: "2023-11-01", status: "Alive", currentWeight: 16, acquisitionType: "Purchased", purchaseCost: 27000, marginPercent: 25, projectedMaxWeight: 36, projectedSalesPrice: "", locationName: "Annex Farm" },
  { tagId: "WGF003", name: "Halima", species: "Goat", breed: "Wad", gender: "Female", dob: "2023-06-15", status: "Alive", currentWeight: 15, acquisitionType: "Purchased", purchaseCost: 25000, marginPercent: 25, projectedMaxWeight: 35, projectedSalesPrice: "", locationName: "Main Farm" },
  { tagId: "WGF004", name: "Asiya", species: "Goat", breed: "Wad", gender: "Female", dob: "2023-07-20", status: "Alive", currentWeight: 14, acquisitionType: "Purchased", purchaseCost: 24000, marginPercent: 25, projectedMaxWeight: 33, projectedSalesPrice: "", locationName: "Main Farm" },
  { tagId: "WGF005", name: "Rukayya", species: "Goat", breed: "Wad", gender: "Female", dob: "2023-08-25", status: "Alive", currentWeight: 13, acquisitionType: "Purchased", purchaseCost: 23000, marginPercent: 25, projectedMaxWeight: 32, projectedSalesPrice: "", locationName: "Annex Farm" },
  { tagId: "WGF006", name: "Hadiza", species: "Goat", breed: "Wad", gender: "Female", dob: "2023-09-30", status: "Alive", currentWeight: 12, acquisitionType: "Purchased", purchaseCost: 22000, marginPercent: 25, projectedMaxWeight: 30, projectedSalesPrice: "", locationName: "Annex Farm" },
  { tagId: "RSF001", name: "Ummi", species: "Goat", breed: "Red Sokoto", gender: "Female", dob: "2023-05-01", status: "Alive", currentWeight: 20, acquisitionType: "Purchased", purchaseCost: 32000, marginPercent: 25, projectedMaxWeight: 40, projectedSalesPrice: "", locationName: "Main Farm" },
  { tagId: "HGF004", name: "Sadia", species: "Goat", breed: "Hadija", gender: "Female", dob: "2023-08-01", status: "Alive", currentWeight: 18, acquisitionType: "Purchased", purchaseCost: 30000, marginPercent: 25, projectedMaxWeight: 38, projectedSalesPrice: "", locationName: "Main Farm" },
  { tagId: "HGF005", name: "Kawthar", species: "Goat", breed: "Hadija", gender: "Female", dob: "2023-09-15", status: "Alive", currentWeight: 17, acquisitionType: "Purchased", purchaseCost: 28000, marginPercent: 25, projectedMaxWeight: 36, projectedSalesPrice: "", locationName: "Main Farm" },
  { tagId: "S-212", name: "Lawal", species: "Sheep", breed: "Balami", gender: "Female", dob: "2025-06-01", status: "Alive", currentWeight: 18.2, acquisitionType: "Bred on farm", purchaseCost: 45000, marginPercent: "", projectedMaxWeight: 50, projectedSalesPrice: "", locationName: "Annex Farm" },
  { tagId: "G-102", name: "Kamal", species: "Goat", breed: "Red Sokoto", gender: "Male", dob: "2025-10-01", status: "Alive", currentWeight: 8.5, acquisitionType: "Bred on farm", purchaseCost: 22000, marginPercent: "", projectedMaxWeight: 40, projectedSalesPrice: "", locationName: "Main Farm" },
  { tagId: "G-088", name: "Ibrahim", species: "Goat", breed: "Boer", gender: "Male", dob: "2022-06-01", status: "Alive", currentWeight: 45, acquisitionType: "Purchased", purchaseCost: 120000, marginPercent: "", projectedMaxWeight: 70, projectedSalesPrice: "", locationName: "Main Farm" },
  { tagId: "G-155", name: "Salma", species: "Goat", breed: "Kalahari", gender: "Female", dob: "2023-01-15", status: "Alive", currentWeight: 38, acquisitionType: "Purchased", purchaseCost: 85000, marginPercent: "", projectedMaxWeight: 55, projectedSalesPrice: "", locationName: "Annex Farm" },
  { tagId: "G-201", name: "Yusuf", species: "Goat", breed: "Red Sokoto", gender: "Male", dob: "2025-11-01", status: "Alive", currentWeight: 7.2, acquisitionType: "Bred on farm", purchaseCost: 18500, marginPercent: "", projectedMaxWeight: 38, projectedSalesPrice: "", locationName: "Main Farm" },
];

const toNumberOrUndefined = (value) => {
  if (value === undefined || value === null || value === "") return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
};

export function buildAnimalSeedData(rows, locationMap = {}) {
  const safeRows = Array.isArray(rows) ? rows : [];
  return safeRows
    .filter((row) => row && String(row.tagId || "").trim())
    .map((row) => {
      const locationName = String(row.locationName || "").trim();
      const location = locationMap[locationName] || null;
      const built = {
        tagId: String(row.tagId || "").trim(),
        name: row.name ? String(row.name).trim() : "",
        species: row.species ? String(row.species).trim() : "",
        breed: row.breed ? String(row.breed).trim() : "",
        gender: row.gender ? String(row.gender).trim() : "",
        dob: row.dob ? new Date(row.dob) : undefined,
        status: row.status ? String(row.status).trim() : "Alive",
        acquisitionType: row.acquisitionType ? String(row.acquisitionType).trim() : "",
        location,
      };
      const currentWeight = toNumberOrUndefined(row.currentWeight);
      const purchaseCost = toNumberOrUndefined(row.purchaseCost);
      const marginPercent = toNumberOrUndefined(row.marginPercent);
      const projectedMaxWeight = toNumberOrUndefined(row.projectedMaxWeight);
      const projectedSalesPrice = toNumberOrUndefined(row.projectedSalesPrice);
      if (currentWeight !== undefined) built.currentWeight = currentWeight;
      if (purchaseCost !== undefined) built.purchaseCost = purchaseCost;
      if (marginPercent !== undefined) built.marginPercent = marginPercent;
      if (projectedMaxWeight !== undefined) built.projectedMaxWeight = projectedMaxWeight;
      if (projectedSalesPrice !== undefined) built.projectedSalesPrice = projectedSalesPrice;
      return built;
    });
}

