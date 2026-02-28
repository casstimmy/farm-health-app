import dbConnect from "@/lib/mongodb";
import Animal from "@/models/Animal";
import Treatment from "@/models/Treatment";
import FeedType from "@/models/FeedType";
import FeedingRecord from "@/models/FeedingRecord";
import WeightRecord from "@/models/WeightRecord";
import VaccinationRecord from "@/models/VaccinationRecord";
import BreedingRecord from "@/models/BreedingRecord";
import MortalityRecord from "@/models/MortalityRecord";
import HealthRecord from "@/models/HealthRecord";
import Inventory from "@/models/Inventory";
import InventoryCategory from "@/models/InventoryCategory";
import Finance from "@/models/Finance";
import Service from "@/models/Service";
import BlogPost from "@/models/BlogPost";
import Location from "@/models/Location";
import User from "@/models/User";
import { withAuth } from "@/utils/middleware";

async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (req.user?.role !== "SuperAdmin") {
    return res.status(403).json({ error: "Forbidden: Only SuperAdmin can seed data" });
  }

  await dbConnect();
  const selectedCategories = Array.isArray(req.body?.selectedCategories) ? req.body.selectedCategories : [];
  const selectedSet = new Set(selectedCategories);
  const runAll = selectedSet.size === 0;
  const shouldSeed = (key) => runAll || selectedSet.has(key);

  const results = {
    cleared: {},
    locations: 0,
    inventoryCategories: 0,
    inventoryItems: 0,
    feedTypes: 0,
    animals: 0,
    treatments: 0,
    healthRecords: 0,
    feedingRecords: 0,
    weightRecords: 0,
    vaccinationRecords: 0,
    breedingRecords: 0,
    mortalityRecords: 0,
    financialTransactions: 0,
    services: 0,
    blogPosts: 0,
    errors: [],
  };

  try {
    // ─── CLEAR ALL OLD DATA ───
    const collections = [
      { model: Animal, name: "Animals" },
      { model: Treatment, name: "Treatments" },
      { model: FeedType, name: "FeedTypes" },
      { model: FeedingRecord, name: "FeedingRecords" },
      { model: WeightRecord, name: "WeightRecords" },
      { model: VaccinationRecord, name: "VaccinationRecords" },
      { model: BreedingRecord, name: "BreedingRecords" },
      { model: MortalityRecord, name: "MortalityRecords" },
      { model: HealthRecord, name: "HealthRecords" },
      { model: Inventory, name: "Inventory" },
      { model: InventoryCategory, name: "InventoryCategories" },
      { model: Finance, name: "Finance" },
      { model: Service, name: "Services" },
      { model: Location, name: "Locations" },
    ];

    if (runAll) {
      for (const { model, name } of collections) {
        try {
          const deleted = await model.deleteMany({});
          results.cleared[name] = deleted.deletedCount;
        } catch (err) {
          results.errors.push(`Clear ${name}: ${err.message}`);
        }
      }
    }

    // ─── 0. Locations ───
    const locationData = [
      { name: "Main Farm", description: "Primary goat farm facility", address: "KM 12 Abuja-Keffi Road", city: "Abuja", state: "FCT" },
      { name: "Annex Farm", description: "Secondary farm location for breeding stock", address: "Plot 5 Gwagwalada", city: "Gwagwalada", state: "FCT" },
    ];

    const locationMap = {};
    if (shouldSeed("locations")) {
      for (const loc of locationData) {
        try {
          const existing = await Location.create(loc);
          results.locations++;
          locationMap[loc.name] = existing._id;
        } catch (err) {
          results.errors.push(`Location ${loc.name}: ${err.message}`);
        }
      }
    }

    // ─── 1. Inventory Categories ───
    const categoryData = [
      { name: "Medication", description: "Veterinary drugs and treatments" },
      { name: "Feed", description: "Animal feed supplies" },
      { name: "Equipment", description: "Farm equipment and tools" },
      { name: "Medical Supplies", description: "Medical supplies and consumables" },
    ];

    const categoryMap = {};
    if (shouldSeed("inventoryCategories")) {
      for (const cat of categoryData) {
        try {
          const existing = await InventoryCategory.create(cat);
          results.inventoryCategories++;
          categoryMap[cat.name] = existing._id;
        } catch (err) {
          results.errors.push(`Category ${cat.name}: ${err.message}`);
        }
      }
    }

    // ─── 2. Inventory Items ───
    const inventoryData = [
      { item: "Ivermectin Injectable", quantity: 30, unit: "Bottle", categoryName: "Medication", minStock: 5, price: 4500, costPrice: 3500, marginPercent: 28, salesPrice: 4500, expiration: new Date("2027-10-17"), supplier: "FarmVet Supplies" },
      { item: "Oxytetracycline", quantity: 20, unit: "Bottle", categoryName: "Medication", minStock: 3, price: 5200, costPrice: 4000, marginPercent: 30, salesPrice: 5200, expiration: new Date("2028-06-30"), supplier: "AgroVet Nigeria" },
      { item: "Kepromec Ivermectin 50ml", quantity: 10, unit: "Bottle", categoryName: "Medication", minStock: 2, price: 3500, costPrice: 2800, marginPercent: 25, salesPrice: 3500, supplier: "Kepro B.V." },
      { item: "Jubail Oxytet 5% 100ml", quantity: 15, unit: "Bottle", categoryName: "Medication", minStock: 3, price: 2500, costPrice: 1800, marginPercent: 39, salesPrice: 2500, supplier: "Jubail Pharma" },
      { item: "Jubail Tylosine 100ml", quantity: 10, unit: "Bottle", categoryName: "Medication", minStock: 2, price: 3000, costPrice: 2200, marginPercent: 36, salesPrice: 3000, supplier: "Jubail Pharma" },
      { item: "Jubail Gentamicine 100ml", quantity: 8, unit: "Bottle", categoryName: "Medication", minStock: 2, price: 2800, costPrice: 2000, marginPercent: 40, salesPrice: 2800, supplier: "Jubail Pharma" },
      { item: "100ml VMultinor", quantity: 12, unit: "Bottle", categoryName: "Medication", minStock: 2, price: 3500, costPrice: 2800, marginPercent: 25, salesPrice: 3500, supplier: "Multinor Vet" },
      { item: "Sulfanor 100ml", quantity: 10, unit: "Bottle", categoryName: "Medication", minStock: 2, price: 2200, costPrice: 1600, marginPercent: 37, salesPrice: 2200, supplier: "Multinor Vet" },
      { item: "Sulfamore 100ml", quantity: 8, unit: "Bottle", categoryName: "Medication", minStock: 2, price: 2500, costPrice: 1900, marginPercent: 31, salesPrice: 2500, supplier: "AgroVet Nigeria" },
      { item: "Jubail Levamisole 100ml", quantity: 6, unit: "Bottle", categoryName: "Medication", minStock: 2, price: 2000, costPrice: 1500, marginPercent: 33, salesPrice: 2000, supplier: "Jubail Pharma" },
      { item: "Jubail Iron 100ml", quantity: 10, unit: "Bottle", categoryName: "Medication", minStock: 2, price: 1800, costPrice: 1300, marginPercent: 38, salesPrice: 1800, supplier: "Jubail Pharma" },
      { item: "Oxytocin10 Ampoule", quantity: 20, unit: "Ampoule", categoryName: "Medication", minStock: 5, price: 3500, costPrice: 2500, marginPercent: 40, salesPrice: 3500, supplier: "FarmVet Supplies" },
      { item: "Pour On Acaricide 210ml", quantity: 5, unit: "Bottle", categoryName: "Medication", minStock: 2, price: 6000, costPrice: 4500, marginPercent: 33, salesPrice: 6000, supplier: "AgroVet Nigeria" },
      { item: "Gadol 200ml", quantity: 4, unit: "Bottle", categoryName: "Medication", minStock: 1, price: 12000, costPrice: 9000, marginPercent: 33, salesPrice: 12000, supplier: "FarmVet Supplies" },
      { item: "oxySpray 210ml", quantity: 6, unit: "Bottle", categoryName: "Medication", minStock: 2, price: 4500, costPrice: 3500, marginPercent: 28, salesPrice: 4500, supplier: "AgroVet Nigeria" },
      { item: "Immunovite 5L", quantity: 3, unit: "Keg", categoryName: "Medication", minStock: 1, price: 15000, costPrice: 12000, marginPercent: 25, salesPrice: 15000, supplier: "FarmVet Supplies" },
      { item: "DD Force", quantity: 4, unit: "Pack", categoryName: "Equipment", minStock: 1, price: 15000, costPrice: 12000, marginPercent: 25, salesPrice: 15000, supplier: "FarmVet Supplies" },
      // Feed items
      { item: "Beans Chaff", quantity: 8, unit: "Bag", categoryName: "Feed", minStock: 2, price: 15000, costPrice: 15000, marginPercent: 0, salesPrice: 15000, supplier: "Local Market" },
      { item: "Wheat Offal", quantity: 4, unit: "Bag", categoryName: "Feed", minStock: 1, price: 15000, costPrice: 15000, marginPercent: 0, salesPrice: 15000, supplier: "Local Market" },
      { item: "Guinea Corn", quantity: 3, unit: "Bag", categoryName: "Feed", minStock: 1, price: 15000, costPrice: 15000, marginPercent: 0, salesPrice: 15000, supplier: "Local Market" },
      { item: "Groundnut Hay", quantity: 10, unit: "Bag", categoryName: "Feed", minStock: 3, price: 15000, costPrice: 15000, marginPercent: 0, salesPrice: 15000, supplier: "Local Farmer" },
      // Medical Supplies
      { item: "Cotton Wool", quantity: 5, unit: "Pack", categoryName: "Medical Supplies", minStock: 2, price: 5000, costPrice: 3500, marginPercent: 42, salesPrice: 5000, supplier: "Pharma Supply" },
      { item: "Iodine (Dozen)", quantity: 2, unit: "Dozen", categoryName: "Medical Supplies", minStock: 1, price: 3500, costPrice: 2500, marginPercent: 40, salesPrice: 3500, supplier: "Pharma Supply" },
      { item: "Safety Hand Gloves", quantity: 6, unit: "Pair", categoryName: "Medical Supplies", minStock: 2, price: 2800, costPrice: 2000, marginPercent: 40, salesPrice: 2800, supplier: "Pharma Supply" },
      { item: "Disposable Gloves", quantity: 4, unit: "Pack", categoryName: "Medical Supplies", minStock: 1, price: 6000, costPrice: 4500, marginPercent: 33, salesPrice: 6000, supplier: "Pharma Supply" },
      { item: "Scalpel Blade", quantity: 3, unit: "Pack", categoryName: "Medical Supplies", minStock: 1, price: 7500, costPrice: 5500, marginPercent: 36, salesPrice: 7500, supplier: "Pharma Supply" },
    ];

    const inventoryMap = {};
    if (shouldSeed("inventoryItems")) {
      for (const inv of inventoryData) {
        try {
          const existing = await Inventory.create({
            item: inv.item,
            quantity: inv.quantity,
            unit: inv.unit,
            category: inv.categoryName,
            categoryId: categoryMap[inv.categoryName] || null,
            categoryName: inv.categoryName,
            price: inv.price,
            costPrice: inv.costPrice || 0,
            marginPercent: inv.marginPercent || 0,
            salesPrice: inv.salesPrice || 0,
            minStock: inv.minStock,
            expiration: inv.expiration || null,
            supplier: inv.supplier,
            dateAdded: new Date(),
          });
          results.inventoryItems++;
          inventoryMap[inv.item] = existing._id;
        } catch (err) {
          results.errors.push(`Inventory ${inv.item}: ${err.message}`);
        }
      }
    }

    // ─── 3. Feed Types ───
    const feedTypeData = [
      { name: "Hay", category: "Forage", purpose: "Growth", method: "Grazing", description: "Dried grass or legume forage" },
      { name: "Pelletized Feed", category: "Concentrate", purpose: "Pregnancy", method: "Trough", description: "Pelletized concentrate feed" },
      { name: "Legumes", category: "Concentrate", purpose: "Lactation", method: "Hand-fed", description: "Legume-based feed" },
      { name: "Supplement", category: "Supplement", purpose: "Growth", method: "Grazing", description: "Nutritional supplement" },
      { name: "Concentrate Mix", category: "Concentrate", purpose: "Energy and protein supplement", method: "Measured feeding", description: "Formulated grain mix" },
      { name: "Silage", category: "Forage", purpose: "Fermented roughage", method: "Trough feeding", description: "Fermented green forage" },
      { name: "Mineral Lick", category: "Supplement", purpose: "Mineral supplementation", method: "Free-access block", description: "Mineral and salt block" },
    ];

    const feedTypeMap = {};
    if (shouldSeed("feedTypes")) {
      for (const ft of feedTypeData) {
        try {
          const existing = await FeedType.create(ft);
          results.feedTypes++;
          feedTypeMap[ft.name] = existing._id;
        } catch (err) {
          results.errors.push(`FeedType ${ft.name}: ${err.message}`);
        }
      }
    }

    // ─── 4. Animals (comprehensive herd) ───
    const mainFarm = locationMap["Main Farm"] || null;
    const annexFarm = locationMap["Annex Farm"] || null;

    const animalData = [
      // Boer Females
      { tagId: "BGF001", name: "Amina", species: "Goat", breed: "Boer", gender: "Female", dob: new Date("2023-03-15"), status: "Alive", currentWeight: 23, acquisitionType: "Purchased", purchaseCost: 45000, marginPercent: 30, projectedMaxWeight: 50, projectedSalesPrice: 58500, location: mainFarm },
      { tagId: "BGF002", name: "Zara", species: "Goat", breed: "Boer", gender: "Female", dob: new Date("2023-04-20"), status: "Alive", currentWeight: 20, acquisitionType: "Purchased", purchaseCost: 42000, marginPercent: 30, projectedMaxWeight: 48, projectedSalesPrice: 54600, location: mainFarm },
      { tagId: "BGF003", name: "Fatima", species: "Goat", breed: "Boer", gender: "Female", dob: new Date("2023-05-10"), status: "Alive", currentWeight: 22, acquisitionType: "Purchased", purchaseCost: 44000, marginPercent: 30, projectedMaxWeight: 50, location: mainFarm },
      { tagId: "BGF004", name: "Aisha", species: "Goat", breed: "Boer", gender: "Female", dob: new Date("2023-06-01"), status: "Alive", currentWeight: 21, acquisitionType: "Purchased", purchaseCost: 43000, marginPercent: 30, projectedMaxWeight: 49, location: mainFarm },
      { tagId: "BGF005", name: "Safiya", species: "Goat", breed: "Boer", gender: "Female", dob: new Date("2023-07-15"), status: "Alive", currentWeight: 20, acquisitionType: "Purchased", purchaseCost: 40000, marginPercent: 30, projectedMaxWeight: 47, location: annexFarm },
      { tagId: "BGF006", name: "Maryam", species: "Goat", breed: "Boer", gender: "Female", dob: new Date("2023-08-20"), status: "Alive", currentWeight: 19, acquisitionType: "Purchased", purchaseCost: 38000, marginPercent: 30, projectedMaxWeight: 45, location: annexFarm },
      // Boer Males
      { tagId: "BGM001", name: "Sultan", species: "Goat", breed: "Boer", gender: "Male", dob: new Date("2022-12-10"), status: "Alive", currentWeight: 45, acquisitionType: "Purchased", purchaseCost: 85000, marginPercent: 30, projectedMaxWeight: 70, projectedSalesPrice: 110500, location: mainFarm },
      { tagId: "BGM002", name: "Khalid", species: "Goat", breed: "Boer", gender: "Male", dob: new Date("2023-02-15"), status: "Alive", currentWeight: 35, acquisitionType: "Purchased", purchaseCost: 65000, marginPercent: 30, projectedMaxWeight: 65, location: mainFarm },
      { tagId: "BGM003", name: "Hassan", species: "Goat", breed: "Boer", gender: "Male", dob: new Date("2023-04-01"), status: "Alive", currentWeight: 30, acquisitionType: "Bred on farm", purchaseCost: 0, marginPercent: 30, projectedMaxWeight: 60, location: mainFarm },
      { tagId: "BGM004", name: "Bashir", species: "Goat", breed: "Boer", gender: "Male", dob: new Date("2023-05-20"), status: "Alive", currentWeight: 28, acquisitionType: "Bred on farm", purchaseCost: 0, marginPercent: 30, projectedMaxWeight: 58, location: annexFarm },
      { tagId: "BGM005", name: "Danjo", species: "Goat", breed: "Boer", gender: "Male", dob: new Date("2023-07-01"), status: "Alive", currentWeight: 25, acquisitionType: "Bred on farm", purchaseCost: 0, marginPercent: 30, projectedMaxWeight: 55, location: annexFarm },
      { tagId: "BGM006", name: "Ameer", species: "Goat", breed: "Boer", gender: "Male", dob: new Date("2023-08-10"), status: "Alive", currentWeight: 22, acquisitionType: "Bred on farm", purchaseCost: 0, marginPercent: 30, projectedMaxWeight: 52, location: annexFarm },
      // Sahel
      { tagId: "SGF001", name: "Hauwa", species: "Goat", breed: "Sahel", gender: "Female", dob: new Date("2023-01-10"), status: "Alive", currentWeight: 23, acquisitionType: "Purchased", purchaseCost: 35000, marginPercent: 25, projectedMaxWeight: 45, location: mainFarm },
      { tagId: "SGF004", name: "Binta", species: "Goat", breed: "Sahel", gender: "Female", dob: new Date("2023-09-01"), status: "Alive", currentWeight: 18, acquisitionType: "Purchased", purchaseCost: 30000, marginPercent: 25, projectedMaxWeight: 40, location: mainFarm },
      { tagId: "SGF005", name: "Nafisa", species: "Goat", breed: "Sahel", gender: "Female", dob: new Date("2023-10-15"), status: "Alive", currentWeight: 17, acquisitionType: "Purchased", purchaseCost: 28000, marginPercent: 25, projectedMaxWeight: 38, location: mainFarm },
      { tagId: "SGF006", name: "Jamila", species: "Goat", breed: "Sahel", gender: "Female", dob: new Date("2023-11-01"), status: "Alive", currentWeight: 16, acquisitionType: "Purchased", purchaseCost: 27000, marginPercent: 25, projectedMaxWeight: 36, location: annexFarm },
      // Wad
      { tagId: "WGF003", name: "Halima", species: "Goat", breed: "Wad", gender: "Female", dob: new Date("2023-06-15"), status: "Alive", currentWeight: 15, acquisitionType: "Purchased", purchaseCost: 25000, marginPercent: 25, projectedMaxWeight: 35, location: mainFarm },
      { tagId: "WGF004", name: "Asiya", species: "Goat", breed: "Wad", gender: "Female", dob: new Date("2023-07-20"), status: "Alive", currentWeight: 14, acquisitionType: "Purchased", purchaseCost: 24000, marginPercent: 25, projectedMaxWeight: 33, location: mainFarm },
      { tagId: "WGF005", name: "Rukayya", species: "Goat", breed: "Wad", gender: "Female", dob: new Date("2023-08-25"), status: "Alive", currentWeight: 13, acquisitionType: "Purchased", purchaseCost: 23000, marginPercent: 25, projectedMaxWeight: 32, location: annexFarm },
      { tagId: "WGF006", name: "Hadiza", species: "Goat", breed: "Wad", gender: "Female", dob: new Date("2023-09-30"), status: "Alive", currentWeight: 12, acquisitionType: "Purchased", purchaseCost: 22000, marginPercent: 25, projectedMaxWeight: 30, location: annexFarm },
      // Red Sokoto
      { tagId: "RSF001", name: "Ummi", species: "Goat", breed: "Red Sokoto", gender: "Female", dob: new Date("2023-05-01"), status: "Alive", currentWeight: 20, acquisitionType: "Purchased", purchaseCost: 32000, marginPercent: 25, projectedMaxWeight: 40, location: mainFarm },
      // Hadija
      { tagId: "HGF004", name: "Sadia", species: "Goat", breed: "Hadija", gender: "Female", dob: new Date("2023-08-01"), status: "Alive", currentWeight: 18, acquisitionType: "Purchased", purchaseCost: 30000, marginPercent: 25, projectedMaxWeight: 38, location: mainFarm },
      { tagId: "HGF005", name: "Kawthar", species: "Goat", breed: "Hadija", gender: "Female", dob: new Date("2023-09-15"), status: "Alive", currentWeight: 17, acquisitionType: "Purchased", purchaseCost: 28000, marginPercent: 25, projectedMaxWeight: 36, location: mainFarm },
      // Sheep (for mortality seed)
      { tagId: "S-212", name: "Lawal", species: "Sheep", breed: "Balami", gender: "Female", dob: new Date("2025-06-01"), status: "Alive", currentWeight: 18.2, acquisitionType: "Bred on farm", purchaseCost: 45000, projectedMaxWeight: 50, location: annexFarm },
      // Extra goats for mortality seed
      { tagId: "G-102", name: "Kamal", species: "Goat", breed: "Red Sokoto", gender: "Male", dob: new Date("2025-10-01"), status: "Alive", currentWeight: 8.5, acquisitionType: "Bred on farm", purchaseCost: 22000, projectedMaxWeight: 40, location: mainFarm },
      { tagId: "G-088", name: "Ibrahim", species: "Goat", breed: "Boer", gender: "Male", dob: new Date("2022-06-01"), status: "Alive", currentWeight: 45, acquisitionType: "Purchased", purchaseCost: 120000, projectedMaxWeight: 70, location: mainFarm },
      { tagId: "G-155", name: "Salma", species: "Goat", breed: "Kalahari", gender: "Female", dob: new Date("2023-01-15"), status: "Alive", currentWeight: 38, acquisitionType: "Purchased", purchaseCost: 85000, projectedMaxWeight: 55, location: annexFarm },
      { tagId: "G-201", name: "Yusuf", species: "Goat", breed: "Red Sokoto", gender: "Male", dob: new Date("2025-11-01"), status: "Alive", currentWeight: 7.2, acquisitionType: "Bred on farm", purchaseCost: 18500, projectedMaxWeight: 38, location: mainFarm },
    ];

    const animalMap = {};
    if (shouldSeed("animals")) {
      for (const a of animalData) {
        try {
          const existing = await Animal.create(a);
          results.animals++;
          animalMap[a.tagId] = existing._id;
        } catch (err) {
          results.errors.push(`Animal ${a.tagId}: ${err.message}`);
        }
      }
    }

    // Set sire/dam references after all animals are created
    if (shouldSeed("animals")) try {
      const sultan = animalMap["BGM001"];
      if (sultan) {
        // Set Sultan as sire for bred-on-farm animals
        const bredAnimals = ["BGM003", "BGM004", "BGM005", "BGM006"];
        for (const tag of bredAnimals) {
          if (animalMap[tag]) {
            await Animal.findByIdAndUpdate(animalMap[tag], { sire: sultan });
          }
        }
        // Set dam references for some bred-on-farm animals
        if (animalMap["BGM003"] && animalMap["BGF001"]) {
          await Animal.findByIdAndUpdate(animalMap["BGM003"], { dam: animalMap["BGF001"] });
        }
        if (animalMap["BGM004"] && animalMap["BGF002"]) {
          await Animal.findByIdAndUpdate(animalMap["BGM004"], { dam: animalMap["BGF002"] });
        }
      }
    } catch (err) {
      results.errors.push(`Sire/Dam linking: ${err.message}`);
    }

    // ─── 5. Health Records (from user's detailed treatment sheets) ───
    const healthRecordData = [
      { animalTag: "SGF001", date: new Date("2024-10-10"), time: "9:00 AM", isRoutine: false, symptoms: "Emaciation", possibleCause: "Exposure to infection from market animals", prescribedDays: 3, duration: "3 Days", preWeight: 22, vaccines: "OCDT", treatmentA: { treatmentType: "Vitamin Dosing", medicationName: "100ml VMultinor", dosage: "2ml", route: "IM" }, needsMultipleTreatments: false, treatedBy: "Azeezat", recoveryStatus: "Regressing" },
      { animalTag: "SGF001", date: new Date("2024-10-13"), time: "10:00 AM", isRoutine: false, symptoms: "Watery faeces", possibleCause: "Exposure to infections", diagnosis: "Diarrhea", prescribedDays: 3, duration: "3 Days", preWeight: 20, vaccines: "OCDT", treatmentA: { treatmentType: "Antibiotics", medicationName: "Sulfanor 100ml", dosage: "4ml", route: "IM" }, treatedBy: "Azeezat", recoveryStatus: "Improving" },
      { animalTag: "SGF001", date: new Date("2024-10-18"), time: "11:00 AM", isRoutine: false, symptoms: "Watery faeces", possibleCause: "Worms", diagnosis: "Diarrhea", prescribedDays: 3, duration: "3 Days Interval", preWeight: 23, vaccines: "PPR", treatmentA: { treatmentType: "Deworming", medicationName: "Kepromec Ivermectin 50ml", dosage: "0.5ml", route: "Subcutaneous" }, treatedBy: "Azeezat", recoveryStatus: "Improving" },
      { animalTag: "BGF001", date: new Date("2024-10-23"), time: "2:00 PM", isRoutine: false, symptoms: "Body scratching against wall", possibleCause: "Lice", diagnosis: "External parasite", prescribedDays: 1, preWeight: 20, vaccines: "OCDT", treatmentA: { treatmentType: "Ext- Parasite", medicationName: "Pour On Acaricide 210ml", dosage: "5ml/Backline", route: "Backline" }, treatedBy: "Azeezat", recoveryStatus: "Improving" },
      { animalTag: "BGF001", date: new Date("2024-10-28"), time: "3:00 PM", isRoutine: false, symptoms: "Wound", possibleCause: "Foreign objects", prescribedDays: 3, preWeight: 23, treatmentA: { treatmentType: "Antibiotics", medicationName: "oxySpray 210ml", dosage: "2 Sprays", route: "Backline" }, treatedBy: "Azeezat", recoveryStatus: "Recovered" },
      { animalTag: "BGF001", date: new Date("2024-11-01"), time: "8:00 AM", isRoutine: false, symptoms: "Weakness after birth", possibleCause: "Parturition", diagnosis: "Low energy", prescribedDays: 1, preWeight: 23, treatmentA: { treatmentType: "Vitamin Dosing", medicationName: "Jubail Iron 100ml", dosage: "4ml", route: "IM" }, treatedBy: "Azeezat", recoveryStatus: "Recovered" },
      { animalTag: "BGF001", date: new Date("2024-11-04"), time: "9:00 AM", isRoutine: false, symptoms: "Loss of hair", possibleCause: "Mange", diagnosis: "Mange", prescribedDays: 3, treatmentA: { treatmentType: "Ext- Parasite", medicationName: "Kepromec Ivermectin 50ml", dosage: "1.5ml", route: "Subcutaneous" }, treatedBy: "Azeezat", recoveryStatus: "Recovered" },
      { animalTag: "BGM001", date: new Date("2024-11-13"), time: "10:00 AM", isRoutine: true, prescribedDays: 0, duration: "Annually", treatmentA: { treatmentType: "Vaccination", dosage: "1ml", route: "Subcutaneous" }, treatedBy: "Azeezat", recoveryStatus: "Recovered" },
      { animalTag: "BGM001", date: new Date("2024-11-16"), time: "11:00 AM", isRoutine: false, symptoms: "Coughing", possibleCause: "Cough", diagnosis: "Cough", prescribedDays: 2, treatmentA: { treatmentType: "Antibiotics", medicationName: "Jubail Tylosine 100ml", dosage: "2ml", route: "IM" }, treatedBy: "Azeezat", recoveryStatus: "Recovered" },
      { animalTag: "BGM001", date: new Date("2024-11-30"), time: "1:00 PM", isRoutine: false, symptoms: "Swelling around the neck", possibleCause: "Abscess", diagnosis: "Abscess", prescribedDays: 3, treatmentA: { treatmentType: "Antibiotics", medicationName: "Jubail Oxytet 5% 100ml", dosage: "1.5ml", route: "IM" }, treatedBy: "Azeezat", recoveryStatus: "Improving" },
      { animalTag: "BGM001", date: new Date("2024-12-22"), time: "2:00 PM", isRoutine: true, symptoms: "Watery faeces with worm", possibleCause: "Worm", diagnosis: "Diarrhea", prescribedDays: 1, treatmentA: { treatmentType: "Deworming", dosage: "10ml", route: "Oral" }, needsMultipleTreatments: true, treatmentB: { treatmentType: "Deworming", medicationName: "Kepromec Ivermectin 50ml", dosage: "1.5ml", route: "Subcutaneous" }, treatedBy: "Azeezat", recoveryStatus: "Improving" },
    ];

    if (shouldSeed("healthRecords")) {
      if (!Object.keys(animalMap).length) {
        const existingAnimals = await Animal.find({}, "_id tagId").lean();
        existingAnimals.forEach((a) => { animalMap[a.tagId] = a._id; });
      }
      if (!Object.keys(inventoryMap).length) {
        const existingInventory = await Inventory.find({}, "_id item").lean();
        existingInventory.forEach((m) => { inventoryMap[m.item] = m._id; });
      }

      for (const hr of healthRecordData) {
        try {
          const animalId = animalMap[hr.animalTag];
          if (!animalId) { results.errors.push(`HealthRecord: Animal ${hr.animalTag} not found`); continue; }

          if (hr.treatmentA?.medicationName && inventoryMap[hr.treatmentA.medicationName]) {
            hr.treatmentA.medication = inventoryMap[hr.treatmentA.medicationName];
          }
          if (hr.treatmentB?.medicationName && inventoryMap[hr.treatmentB?.medicationName]) {
            hr.treatmentB.medication = inventoryMap[hr.treatmentB.medicationName];
          }

          const animal = await Animal.findById(animalId);
          await HealthRecord.create({
            ...hr,
            animal: animalId,
            animalTagId: animal?.tagId,
            animalGender: animal?.gender,
            animalBreed: animal?.breed,
          });
          results.healthRecords++;
        } catch (err) {
          results.errors.push(`HealthRecord for ${hr.animalTag}: ${err.message}`);
        }
      }
    }

    // ─── 6. Breeding Records ───
    const treatmentData = [
      { animalTag: "SGF001", date: new Date("2024-10-10"), routine: "NO", symptoms: "Emaciation", diagnosis: "Weakness", prescribedDays: 3, type: "Vitamin Dosing", medicationName: "100ml VMultinor", dosage: "2ml", route: "IM", treatedBy: "Azeezat", preWeight: 22, postWeight: 23, recoveryStatus: "Improving" },
      { animalTag: "SGF001", date: new Date("2024-10-13"), routine: "NO", symptoms: "Watery faeces", diagnosis: "Diarrhea", prescribedDays: 3, type: "Antibiotics", medicationName: "Sulfanor 100ml", dosage: "4ml", route: "IM", treatedBy: "Azeezat", preWeight: 20, postWeight: 21, recoveryStatus: "Improving" },
      { animalTag: "BGF001", date: new Date("2024-10-28"), routine: "NO", symptoms: "Wound", diagnosis: "Injury", prescribedDays: 3, type: "Antibiotics", medicationName: "oxySpray 210ml", dosage: "2 Sprays", route: "Backline", treatedBy: "Azeezat", preWeight: 23, postWeight: 24, recoveryStatus: "Recovered" },
    ];

    if (shouldSeed("treatments")) {
      if (!Object.keys(animalMap).length) {
        const existingAnimals = await Animal.find({}, "_id tagId").lean();
        existingAnimals.forEach((a) => { animalMap[a.tagId] = a._id; });
      }
      if (!Object.keys(inventoryMap).length) {
        const existingInventory = await Inventory.find({}, "_id item").lean();
        existingInventory.forEach((m) => { inventoryMap[m.item] = m._id; });
      }
      for (const t of treatmentData) {
        try {
          const animalId = animalMap[t.animalTag];
          if (!animalId) {
            results.errors.push(`Treatment: Animal ${t.animalTag} not found`);
            continue;
          }
          const medicationId = inventoryMap[t.medicationName] || null;
          await Treatment.create({
            animal: animalId,
            date: t.date,
            routine: t.routine,
            symptoms: t.symptoms,
            diagnosis: t.diagnosis,
            prescribedDays: t.prescribedDays,
            type: t.type,
            medication: medicationId,
            medicationName: t.medicationName,
            dosage: t.dosage,
            route: t.route,
            treatedBy: t.treatedBy,
            preWeight: t.preWeight,
            postWeight: t.postWeight,
            recoveryStatus: t.recoveryStatus,
          });
          results.treatments++;
        } catch (err) {
          results.errors.push(`Treatment for ${t.animalTag}: ${err.message}`);
        }
      }
    }

    const breedingData = [
      { breedingId: "BRD001", species: "Goat", doeTag: "BGF001", buckTag: "BGM001", matingDate: new Date("2025-09-08"), breedingType: "AI", breedingCoordinator: "Azeezat", pregnancyCheckDate: new Date("2025-08-18"), pregnancyStatus: "Delivered", expectedDueDate: new Date("2025-12-30"), actualKiddingDate: new Date("2026-01-03"), kidsAlive: 2, kidsDead: 0 },
      { breedingId: "BRD002", species: "Goat", doeTag: "BGF002", buckTag: "BGM001", matingDate: new Date("2025-09-08"), breedingType: "AI", breedingCoordinator: "Azeezat", pregnancyCheckDate: new Date("2025-08-19"), pregnancyStatus: "Delivered", expectedDueDate: new Date("2025-12-31"), actualKiddingDate: new Date("2026-01-04"), kidsAlive: 2, kidsDead: 0 },
      { breedingId: "BRD003", species: "Goat", doeTag: "SGF001", buckTag: "BGM001", matingDate: new Date("2025-09-08"), breedingType: "AI", breedingCoordinator: "Azeezat", pregnancyCheckDate: new Date("2025-08-20"), pregnancyStatus: "Delivered", expectedDueDate: new Date("2026-01-01"), actualKiddingDate: new Date("2026-01-05"), kidsAlive: 3, kidsDead: 0, notes: "Due to severe diarrhea" },
      { breedingId: "BRD004", species: "Goat", doeTag: "SGF006", buckTag: "BGM001", matingDate: new Date("2025-09-08"), breedingType: "AI", breedingCoordinator: "Azeezat", pregnancyCheckDate: new Date("2025-08-21"), pregnancyStatus: "Delivered", expectedDueDate: new Date("2026-01-02"), actualKiddingDate: new Date("2026-01-06"), kidsAlive: 2, kidsDead: 0 },
      { breedingId: "BRD005", species: "Goat", doeTag: "WGF003", buckTag: "BGM001", matingDate: new Date("2025-09-08"), breedingType: "AI", breedingCoordinator: "Azeezat", pregnancyCheckDate: new Date("2025-08-22"), pregnancyStatus: "Delivered", expectedDueDate: new Date("2026-01-03"), actualKiddingDate: new Date("2026-01-07"), kidsAlive: 2, kidsDead: 0 },
      { breedingId: "BRD006", species: "Goat", doeTag: "WGF004", buckTag: "BGM001", matingDate: new Date("2025-09-08"), breedingType: "AI", breedingCoordinator: "Azeezat", pregnancyCheckDate: new Date("2025-08-23"), pregnancyStatus: "Delivered", expectedDueDate: new Date("2026-01-04"), actualKiddingDate: new Date("2026-01-08"), kidsAlive: 3, kidsDead: 0 },
      { breedingId: "BRD007", species: "Goat", doeTag: "WGF005", buckTag: "BGM001", matingDate: new Date("2025-09-08"), breedingType: "AI", breedingCoordinator: "Azeezat", pregnancyCheckDate: new Date("2025-08-24"), pregnancyStatus: "Delivered", expectedDueDate: new Date("2026-01-05"), actualKiddingDate: new Date("2026-01-09"), kidsAlive: 2, kidsDead: 0 },
      { breedingId: "BRD008", species: "Goat", doeTag: "WGF006", buckTag: "BGM001", matingDate: new Date("2025-09-08"), breedingType: "AI", breedingCoordinator: "Azeezat", pregnancyCheckDate: new Date("2025-08-25"), pregnancyStatus: "Delivered", expectedDueDate: new Date("2026-01-06"), actualKiddingDate: new Date("2026-01-10"), kidsAlive: 2, kidsDead: 0 },
      { breedingId: "BRD009", species: "Goat", doeTag: "RSF001", buckTag: "BGM001", matingDate: new Date("2025-09-08"), breedingType: "AI", breedingCoordinator: "Azeezat", pregnancyCheckDate: new Date("2025-08-26"), pregnancyStatus: "Delivered", expectedDueDate: new Date("2026-01-07"), actualKiddingDate: new Date("2026-01-11"), kidsAlive: 2, kidsDead: 0 },
      { breedingId: "BRD010", species: "Goat", doeTag: "HGF004", buckTag: "BGM001", matingDate: new Date("2025-09-08"), breedingType: "AI", breedingCoordinator: "Azeezat", pregnancyCheckDate: new Date("2025-08-27"), pregnancyStatus: "Delivered", expectedDueDate: new Date("2026-01-08"), actualKiddingDate: new Date("2026-01-12"), kidsAlive: 1, kidsDead: 0 },
      { breedingId: "BRD011", species: "Goat", doeTag: "HGF005", buckTag: "BGM001", matingDate: new Date("2025-09-08"), breedingType: "AI", breedingCoordinator: "Azeezat", pregnancyCheckDate: new Date("2025-08-28"), pregnancyStatus: "Delivered", expectedDueDate: new Date("2026-01-09"), actualKiddingDate: new Date("2026-01-13"), kidsAlive: 2, kidsDead: 0 },
      { breedingId: "BRD012", species: "Goat", doeTag: "SGF004", buckTag: "BGM001", matingDate: new Date("2025-09-08"), breedingType: "AI", breedingCoordinator: "Azeezat", pregnancyCheckDate: new Date("2025-08-29"), pregnancyStatus: "Delivered", expectedDueDate: new Date("2026-01-10"), actualKiddingDate: new Date("2026-01-14"), kidsAlive: 3, kidsDead: 0 },
      { breedingId: "BRD013", species: "Goat", doeTag: "SGF005", buckTag: "BGM001", matingDate: new Date("2025-09-08"), breedingType: "AI", breedingCoordinator: "Azeezat", pregnancyCheckDate: new Date("2025-08-30"), pregnancyStatus: "Delivered", expectedDueDate: new Date("2026-01-11"), actualKiddingDate: new Date("2026-01-15"), kidsAlive: 3, kidsDead: 0 },
    ];

    if (shouldSeed("breedingRecords")) {
      if (!Object.keys(animalMap).length) {
        const existingAnimals = await Animal.find({}, "_id tagId").lean();
        existingAnimals.forEach((a) => { animalMap[a.tagId] = a._id; });
      }
      for (const b of breedingData) {
        try {
          const doe = animalMap[b.doeTag];
          const buck = animalMap[b.buckTag];
          if (!doe || !buck) { results.errors.push(`Breeding: doe ${b.doeTag} or buck ${b.buckTag} not found`); continue; }
          await BreedingRecord.create({
            breedingId: b.breedingId,
            species: b.species,
            doe,
            buck,
            matingDate: b.matingDate,
            breedingType: b.breedingType,
            breedingCoordinator: b.breedingCoordinator,
            pregnancyCheckDate: b.pregnancyCheckDate,
            pregnancyStatus: b.pregnancyStatus,
            expectedDueDate: b.expectedDueDate,
            actualKiddingDate: b.actualKiddingDate,
            kidsAlive: b.kidsAlive,
            kidsDead: b.kidsDead,
            notes: b.notes || "",
          });
          results.breedingRecords++;
        } catch (err) {
          results.errors.push(`Breeding ${b.breedingId}: ${err.message}`);
        }
      }
    }

    // ─── 7. Mortality Records ───
    const mortalityData = [
      { animalTag: "G-102", dateOfDeath: new Date("2026-02-01"), cause: "Disease", symptoms: "Nasal discharge, labored breathing", daysSick: 4, weight: 8.5, estimatedValue: 22000, disposalMethod: "Burial", reportedBy: "Tunde O." },
      { animalTag: "G-088", dateOfDeath: new Date("2026-02-04"), cause: "Disease", symptoms: "Distended abdomen, sudden collapse", daysSick: 0, weight: 45, estimatedValue: 120000, disposalMethod: "Incinerated", reportedBy: "Musa B.", notes: "Bloat - sudden death" },
      { animalTag: "S-212", dateOfDeath: new Date("2026-02-05"), cause: "Disease", symptoms: "Pale gums, lethargy, bottle jaw", daysSick: 10, weight: 18.2, estimatedValue: 45000, disposalMethod: "Burial", reportedBy: "Tunde O.", notes: "Severe worm load" },
      { animalTag: "G-155", dateOfDeath: new Date("2026-02-09"), cause: "Birth Complications", symptoms: "Dystocia, heavy bleeding", daysSick: 1, weight: 38, estimatedValue: 85000, disposalMethod: "Autopsy/Dispose", reportedBy: "Musa B." },
      { animalTag: "G-201", dateOfDeath: new Date("2026-02-11"), cause: "Unknown", symptoms: "Found dead, no prior symptoms", daysSick: 0, weight: 7.2, estimatedValue: 18500, disposalMethod: "Incinerated", reportedBy: "Tunde O." },
    ];

    if (shouldSeed("mortalityRecords")) {
      if (!Object.keys(animalMap).length) {
        const existingAnimals = await Animal.find({}, "_id tagId").lean();
        existingAnimals.forEach((a) => { animalMap[a.tagId] = a._id; });
      }
      for (const m of mortalityData) {
        try {
          const animalId = animalMap[m.animalTag];
          if (!animalId) { results.errors.push(`Mortality: Animal ${m.animalTag} not found`); continue; }
          await MortalityRecord.create({
            animal: animalId,
            dateOfDeath: m.dateOfDeath,
            cause: m.cause,
            symptoms: m.symptoms,
            daysSick: m.daysSick,
            weight: m.weight,
            estimatedValue: m.estimatedValue,
            disposalMethod: m.disposalMethod,
            reportedBy: m.reportedBy,
            notes: m.notes || "",
          });
          results.mortalityRecords++;
        } catch (err) {
          results.errors.push(`Mortality for ${m.animalTag}: ${err.message}`);
        }
      }
    }

    // ─── 8. Financial Transactions (comprehensive expense data) ───
    const financeData = [
      // August 2025
      { date: new Date("2025-08-31"), type: "Expense", category: "Farm Expenses", title: "Feed TF to Annex Farm", amount: 500 },
      { date: new Date("2025-08-31"), type: "Expense", category: "Farm Expenses", title: "Fuel for Wisdom", amount: 1000 },
      { date: new Date("2025-08-31"), type: "Income", category: "Deposit", title: "General Income", amount: 382400 },
      // September 2025
      { date: new Date("2025-09-02"), type: "Expense", category: "Admin Expenses", title: "Monthly Data", amount: 5000 },
      { date: new Date("2025-09-02"), type: "Expense", category: "Admin Expenses", title: "Annex farm Gas refill", amount: 3900 },
      { date: new Date("2025-09-04"), type: "Expense", category: "Farm Expenses", title: "Packing of Raised Pen (3 pen)", amount: 2000 },
      { date: new Date("2025-09-06"), type: "Expense", category: "Farm Expenses", title: "Feed TF to Annex farm", amount: 500 },
      { date: new Date("2025-09-06"), type: "Expense", category: "Kidding Kit", title: "Dettol (3)", amount: 6000 },
      { date: new Date("2025-09-06"), type: "Expense", category: "Kidding Kit", title: "Towel (3)", amount: 3500 },
      { date: new Date("2025-09-06"), type: "Expense", category: "Kidding Kit", title: "Pen (6)", amount: 500 },
      { date: new Date("2025-09-06"), type: "Expense", category: "Transport", title: "Transport fare", amount: 1000 },
      { date: new Date("2025-09-08"), type: "Expense", category: "Farm Expenses", title: "Helping to rearrange feed inside warehouse", amount: 2000 },
      { date: new Date("2025-09-09"), type: "Expense", category: "Medication", title: "Oxytocin (2)", amount: 7000 },
      { date: new Date("2025-09-09"), type: "Expense", category: "Medication", title: "Gadol (1 carton)", amount: 24000 },
      { date: new Date("2025-09-09"), type: "Expense", category: "Medical Supplies", title: "Safety Hand Glove (3 pair)", amount: 8400 },
      { date: new Date("2025-09-09"), type: "Expense", category: "Medical Supplies", title: "Disposable Glove (2 packs)", amount: 12000 },
      { date: new Date("2025-09-09"), type: "Expense", category: "Medical Supplies", title: "Cotton Wool", amount: 5000 },
      { date: new Date("2025-09-09"), type: "Expense", category: "Medical Supplies", title: "Iodine (dozen)", amount: 3500 },
      { date: new Date("2025-09-09"), type: "Expense", category: "Medical Supplies", title: "Scalpel Blade", amount: 7500 },
      { date: new Date("2025-09-09"), type: "Expense", category: "Transport", title: "Rider + Driver + Airtime + Transport", amount: 8000 },
      { date: new Date("2025-09-11"), type: "Expense", category: "Farm Expenses", title: "Pure water + 2 bulb (farm) + POS charges", amount: 1300 },
      { date: new Date("2025-09-12"), type: "Expense", category: "Farm Expenses", title: "Mr Abdullah medication + food", amount: 6500 },
      { date: new Date("2025-09-14"), type: "Income", category: "Deposit", title: "Deposit", amount: 200000 },
      { date: new Date("2025-09-14"), type: "Expense", category: "Annex Farm Workers Room", title: "Curtain (4 window)", amount: 30000 },
      { date: new Date("2025-09-14"), type: "Expense", category: "Annex Farm Workers Room", title: "Rod (2) + Hanger (2)", amount: 11000 },
      { date: new Date("2025-09-14"), type: "Expense", category: "Admin Expenses", title: "Gas refill for A.Z (3kg)", amount: 3600 },
      { date: new Date("2025-09-14"), type: "Expense", category: "Farm Expenses", title: "Cooking pot for A.Z + Transport", amount: 14100 },
      { date: new Date("2025-09-14"), type: "Expense", category: "Farm Expenses", title: "Paid those helping to fetch for a week", amount: 1200 },
      { date: new Date("2025-09-15"), type: "Expense", category: "Feed", title: "Beans chaff 4 bag", amount: 60000 },
      { date: new Date("2025-09-15"), type: "Expense", category: "Feed", title: "Wheat offal 1 bag", amount: 15000 },
      { date: new Date("2025-09-15"), type: "Expense", category: "Feed", title: "Guinea corn 1 bag", amount: 15000 },
      { date: new Date("2025-09-15"), type: "Expense", category: "Farm Expenses", title: "Padlocks (2)", amount: 14000 },
      { date: new Date("2025-09-15"), type: "Expense", category: "Farm Expenses", title: "Water house", amount: 32000 },
      { date: new Date("2025-09-17"), type: "Expense", category: "Transport", title: "Feed Transportation by Baba Kuwam", amount: 18000 },
      { date: new Date("2025-09-18"), type: "Expense", category: "Farm Expenses", title: "Hangle bracket + Rice + Annex refill + Transport", amount: 27000 },
      { date: new Date("2025-09-18"), type: "Expense", category: "Farm Expenses", title: "Umbrella for farm", amount: 9000 },
      { date: new Date("2025-09-18"), type: "Expense", category: "Feed", title: "Groundnut Hay", amount: 15000 },
      { date: new Date("2025-09-19"), type: "Expense", category: "Farm Expenses", title: "Screws, Bits, T-Fare", amount: 28000 },
      { date: new Date("2025-09-22"), type: "Expense", category: "Farm Expenses", title: "Groundnut seed 2 pent + bike", amount: 14000 },
      { date: new Date("2025-09-22"), type: "Expense", category: "Admin Expenses", title: "Electronic levy + Airtime + Pure water", amount: 5200 },
      { date: new Date("2025-09-27"), type: "Expense", category: "Farm Expenses", title: "Bebo carry feed + Groundnut leaves", amount: 2500 },
      { date: new Date("2025-09-30"), type: "Expense", category: "Farm Expenses", title: "Noodles money by Baba Quwam", amount: 16000 },
      // October 2025
      { date: new Date("2025-10-03"), type: "Expense", category: "Admin Expenses", title: "Monthly Data", amount: 5000 },
      { date: new Date("2025-10-04"), type: "Expense", category: "Admin Expenses", title: "Annex farm gas refill", amount: 3500 },
      { date: new Date("2025-10-08"), type: "Expense", category: "Farm Expenses", title: "Main Goat & Annex farm litters packing", amount: 3000 },
      { date: new Date("2025-10-11"), type: "Expense", category: "Feed", title: "Groundnut Hay", amount: 15000 },
      { date: new Date("2025-10-12"), type: "Expense", category: "Medication", title: "Drug for Sahel (Diastop, Vitamin C, Flagyl, ORS, etc.)", amount: 9859 },
      { date: new Date("2025-10-13"), type: "Expense", category: "Medication", title: "Badagry store antidiarrheals + Glucose + ORS", amount: 10309 },
      { date: new Date("2025-10-16"), type: "Income", category: "Deposit", title: "Deposit POP from boss", amount: 240000 },
      { date: new Date("2025-10-16"), type: "Expense", category: "Farm Expenses", title: "Wisdom petrol + bike + broom + pure water", amount: 4750 },
      { date: new Date("2025-10-16"), type: "Income", category: "Harvest", title: "Groundnut Harvested (6 pent)", amount: 19000 },
      { date: new Date("2025-10-21"), type: "Expense", category: "Farm Expenses", title: "Carpenter payment by Baba Quwam", amount: 20000 },
      { date: new Date("2025-10-21"), type: "Expense", category: "Farm Expenses", title: "Kids helping to fetch weekly", amount: 1500 },
      { date: new Date("2025-10-26"), type: "Expense", category: "Farm Expenses", title: "Carpenter finishing job", amount: 20000 },
      { date: new Date("2025-10-28"), type: "Expense", category: "Admin Expenses", title: "Fatiu data", amount: 1500 },
      { date: new Date("2025-10-29"), type: "Expense", category: "Farm Expenses", title: "Cleaning of New Goat House + charges", amount: 9250 },
      { date: new Date("2025-10-27"), type: "Expense", category: "Farm Expenses", title: "Kids fetching water", amount: 2000 },
      // November 2025
      { date: new Date("2025-11-01"), type: "Expense", category: "Feed", title: "Groundnut Hay 3 bag", amount: 45000 },
      { date: new Date("2025-11-01"), type: "Expense", category: "Farm Expenses", title: "DD Force 2", amount: 24000 },
      { date: new Date("2025-11-01"), type: "Expense", category: "Farm Expenses", title: "Fathiu compensation", amount: 20000 },
      { date: new Date("2025-11-04"), type: "Expense", category: "Farm Expenses", title: "Balance of DD Force (price increase)", amount: 6000 },
      { date: new Date("2025-11-04"), type: "Expense", category: "Admin Expenses", title: "Monthly Data subscription", amount: 5000 },
      { date: new Date("2025-11-18"), type: "Expense", category: "Feed", title: "2 bag of Guinea corn", amount: 30000 },
      { date: new Date("2025-11-27"), type: "Expense", category: "Feed", title: "2 bag of Groundnut Hay", amount: 30000 },
      { date: new Date("2025-11-29"), type: "Expense", category: "Farm Expenses", title: "Petrol by Engineer for goat pen + Transport", amount: 10000 },
      // December 2025
      { date: new Date("2025-12-08"), type: "Expense", category: "Admin Expenses", title: "Annex Farm gas refill", amount: 3600 },
      { date: new Date("2025-12-10"), type: "Expense", category: "Admin Expenses", title: "Monthly Data", amount: 5000 },
      { date: new Date("2025-12-13"), type: "Expense", category: "Farm Expenses", title: "Warehouse rearrangement", amount: 15000 },
      { date: new Date("2025-12-15"), type: "Income", category: "Deposit", title: "Farm Expenses Deposit", amount: 200000 },
      { date: new Date("2025-12-16"), type: "Expense", category: "Feed", title: "2 pcs Groundnut Hay + 2 pcs Beans chaff + 2 pcs Wheat offal", amount: 90000 },
      { date: new Date("2025-12-19"), type: "Expense", category: "Farm Expenses", title: "3 pcs of 5L keg by Baba Kuwam", amount: 2100 },
      { date: new Date("2025-12-24"), type: "Expense", category: "Medication", title: "3 pcs Gentamicin eye drops + ABF cream", amount: 2300 },
      { date: new Date("2025-12-24"), type: "Expense", category: "Transport", title: "Transport fare", amount: 1500 },
      { date: new Date("2025-12-26"), type: "Expense", category: "Admin Expenses", title: "Data for Baba Kuwam", amount: 1500 },
      // January 2026
      { date: new Date("2026-01-05"), type: "Expense", category: "Admin Expenses", title: "Gas refill + Carpenter sent to Baba Quwam", amount: 10000 },
      { date: new Date("2026-01-07"), type: "Expense", category: "Feed", title: "2 bag Groundnut Hay + 1 bag Wheat offal + 1 bag Beans chaff", amount: 60000 },
    ];

    if (shouldSeed("financialTransactions")) {
      for (const f of financeData) {
        try {
          await Finance.create({
            date: f.date,
            type: f.type,
            category: f.category,
            title: f.title,
            description: f.description || f.title,
            amount: f.amount,
            status: "Completed",
          });
          results.financialTransactions++;
        } catch (err) {
          results.errors.push(`Finance ${f.title}: ${err.message}`);
        }
      }
    }

    // ─── 9. Services ───
    const serviceData = [
      { name: "Veterinary Consultation", category: "Veterinary Services", description: "On-site veterinary health check and consultation", price: 15000, unit: "per visit", showOnSite: true },
      { name: "Deworming Service", category: "Veterinary Services", description: "Complete deworming treatment for livestock", price: 2000, unit: "per head", showOnSite: true },
      { name: "Vaccination Service", category: "Veterinary Services", description: "Routine vaccination administration", price: 1500, unit: "per head", showOnSite: true },
      { name: "Artificial Insemination", category: "Breeding Services", description: "AI breeding service with quality semen", price: 25000, unit: "per session", showOnSite: true },
      { name: "Pregnancy Diagnosis", category: "Breeding Services", description: "Ultrasound pregnancy check", price: 5000, unit: "per head", showOnSite: true },
      { name: "Feed Formulation", category: "Feed & Nutrition", description: "Custom feed ration formulation", price: 10000, unit: "per formula", showOnSite: false },
      { name: "Livestock Training", category: "Training & Consultation", description: "Hands-on livestock management training", price: 50000, unit: "per day", showOnSite: true },
      { name: "Farm Setup Consultation", category: "Training & Consultation", description: "Complete farm planning and setup advisory", price: 100000, unit: "per project", showOnSite: true },
      { name: "Meat Processing", category: "Processing & Value Addition", description: "Animal slaughter and processing", price: 5000, unit: "per head", showOnSite: false },
      { name: "Manure Sales", category: "Waste Management", description: "Composted manure for sale", price: 3000, unit: "per bag", showOnSite: true },
      { name: "Live Animal Sales", category: "Animal Sales", description: "Quality breeding and market animals", price: 0, unit: "varies", showOnSite: true },
      { name: "Pen Rental", category: "Equipment & Facilities", description: "Short-term pen/stall rental", price: 1000, unit: "per day", showOnSite: false },
    ];

    if (shouldSeed("services")) {
      for (const s of serviceData) {
        try {
          await Service.create(s);
          results.services++;
        } catch (err) {
          results.errors.push(`Service ${s.name}: ${err.message}`);
        }
      }
    }

    const blogSeedData = [
      {
        title: "Best Feeding Routine For Growing Goats",
        slug: "best-feeding-routine-growing-goats",
        excerpt: "A practical weekly feeding structure that improves growth and lowers waste.",
        content: "Use age-group feeding schedules, measure leftovers daily, and adjust protein intake by season.",
        category: "Animal Care",
        tags: ["feeding", "goats", "growth"],
        status: "Published",
        showOnSite: true,
        publishedAt: new Date(),
      },
      {
        title: "Preventive Health Plan For Small Farms",
        slug: "preventive-health-plan-small-farms",
        excerpt: "How to combine vaccinations, deworming, and treatment logs for better outcomes.",
        content: "Set monthly health checks, maintain medication inventory, and track treatment response by animal.",
        category: "Farm Health",
        tags: ["health", "vaccination", "treatment"],
        status: "Published",
        showOnSite: true,
        publishedAt: new Date(),
      },
    ];

    if (shouldSeed("blogPosts")) {
      for (const post of blogSeedData) {
        try {
          await BlogPost.create(post);
          results.blogPosts++;
        } catch (err) {
          results.errors.push(`Blog ${post.title}: ${err.message}`);
        }
      }
    }

    // ─── 10. Feed Types (extended) ───
    // Already seeded above in section 3

    // ─── 11. Weight Records ───
    const weightData = [
      { animalTag: "BGF001", weightKg: 18, date: new Date("2025-06-15"), recordedBy: "Azeezat" },
      { animalTag: "BGF001", weightKg: 20, date: new Date("2025-08-10"), recordedBy: "Azeezat" },
      { animalTag: "BGF001", weightKg: 23, date: new Date("2025-10-23"), recordedBy: "Azeezat" },
      { animalTag: "BGF002", weightKg: 15, date: new Date("2025-06-20"), recordedBy: "Azeezat" },
      { animalTag: "BGF002", weightKg: 18, date: new Date("2025-08-15"), recordedBy: "Azeezat" },
      { animalTag: "BGF002", weightKg: 20, date: new Date("2025-10-23"), recordedBy: "Azeezat" },
      { animalTag: "BGM001", weightKg: 38, date: new Date("2025-06-01"), recordedBy: "Azeezat" },
      { animalTag: "BGM001", weightKg: 42, date: new Date("2025-09-01"), recordedBy: "Azeezat" },
      { animalTag: "BGM001", weightKg: 45, date: new Date("2025-11-01"), recordedBy: "Azeezat" },
      { animalTag: "SGF001", weightKg: 18, date: new Date("2025-07-10"), recordedBy: "Azeezat" },
      { animalTag: "SGF001", weightKg: 21, date: new Date("2025-09-05"), recordedBy: "Azeezat" },
      { animalTag: "SGF001", weightKg: 23, date: new Date("2025-10-18"), recordedBy: "Azeezat" },
      { animalTag: "BGM002", weightKg: 28, date: new Date("2025-07-15"), recordedBy: "Azeezat" },
      { animalTag: "BGM002", weightKg: 32, date: new Date("2025-09-20"), recordedBy: "Azeezat" },
      { animalTag: "BGM002", weightKg: 35, date: new Date("2025-11-10"), recordedBy: "Azeezat" },
      { animalTag: "BGF003", weightKg: 17, date: new Date("2025-07-01"), recordedBy: "Azeezat" },
      { animalTag: "BGF003", weightKg: 20, date: new Date("2025-09-15"), recordedBy: "Azeezat" },
      { animalTag: "BGF003", weightKg: 22, date: new Date("2025-11-20"), recordedBy: "Azeezat" },
    ];

    if (shouldSeed("weightRecords")) {
      if (!Object.keys(animalMap).length) {
        const existingAnimals = await Animal.find({}, "_id tagId").lean();
        existingAnimals.forEach((a) => { animalMap[a.tagId] = a._id; });
      }
      for (const w of weightData) {
        try {
          const animalId = animalMap[w.animalTag];
          if (!animalId) { results.errors.push(`Weight: Animal ${w.animalTag} not found`); continue; }
          await WeightRecord.create({ animal: animalId, weightKg: w.weightKg, date: w.date, recordedBy: w.recordedBy });
          results.weightRecords++;
        } catch (err) {
          results.errors.push(`Weight for ${w.animalTag}: ${err.message}`);
        }
      }
    }

    // ─── 12. Feeding Records ───
    const feedingData = [
      { animalTag: "BGF001", feedTypeName: "Beans Chaff", quantityOffered: 2, quantityConsumed: 1.8, unitCost: 200, totalCost: 360, date: new Date("2025-10-23"), feedingMethod: "Trough", notes: "Morning feed" },
      { animalTag: "BGF001", feedTypeName: "Groundnut Hay", quantityOffered: 3, quantityConsumed: 2.5, unitCost: 150, totalCost: 375, date: new Date("2025-10-24"), feedingMethod: "Trough" },
      { animalTag: "BGF002", feedTypeName: "Wheat Offal", quantityOffered: 2, quantityConsumed: 2, unitCost: 180, totalCost: 360, date: new Date("2025-10-23"), feedingMethod: "Trough" },
      { animalTag: "BGM001", feedTypeName: "Beans Chaff", quantityOffered: 4, quantityConsumed: 3.5, unitCost: 200, totalCost: 700, date: new Date("2025-11-01"), feedingMethod: "Trough" },
      { animalTag: "BGM001", feedTypeName: "Guinea Corn", quantityOffered: 2, quantityConsumed: 2, unitCost: 250, totalCost: 500, date: new Date("2025-11-02"), feedingMethod: "Hand-fed" },
      { animalTag: "SGF001", feedTypeName: "Groundnut Hay", quantityOffered: 2, quantityConsumed: 1.5, unitCost: 150, totalCost: 225, date: new Date("2025-10-18"), feedingMethod: "Grazing" },
      { animalTag: "BGM002", feedTypeName: "Beans Chaff", quantityOffered: 3, quantityConsumed: 2.8, unitCost: 200, totalCost: 560, date: new Date("2025-11-10"), feedingMethod: "Trough" },
      { animalTag: "BGF003", feedTypeName: "Wheat Offal", quantityOffered: 2, quantityConsumed: 1.5, unitCost: 180, totalCost: 270, date: new Date("2025-11-20"), feedingMethod: "Trough" },
    ];

    if (shouldSeed("feedingRecords")) {
      if (!Object.keys(animalMap).length) {
        const existingAnimals = await Animal.find({}, "_id tagId").lean();
        existingAnimals.forEach((a) => { animalMap[a.tagId] = a._id; });
      }
      if (!Object.keys(inventoryMap).length) {
        const existingInventory = await Inventory.find({}, "_id item").lean();
        existingInventory.forEach((m) => { inventoryMap[m.item] = m._id; });
      }
      for (const fd of feedingData) {
        try {
          const animalId = animalMap[fd.animalTag];
          if (!animalId) { results.errors.push(`Feeding: Animal ${fd.animalTag} not found`); continue; }
          const invId = inventoryMap[fd.feedTypeName] || null;
          await FeedingRecord.create({
            animal: animalId,
            feedTypeName: fd.feedTypeName,
            inventoryItem: invId,
            quantityOffered: fd.quantityOffered,
            quantityConsumed: fd.quantityConsumed,
            unitCost: fd.unitCost,
            totalCost: fd.totalCost,
            date: fd.date,
            feedingMethod: fd.feedingMethod,
            notes: fd.notes || "",
          });
          results.feedingRecords++;
        } catch (err) {
          results.errors.push(`Feeding for ${fd.animalTag}: ${err.message}`);
        }
      }
    }

    // ─── 13. Vaccination Records ───
    const vaccinationData = [
      { animalTag: "BGM001", vaccineName: "PPR Vaccine", dosage: "1ml", method: "Subcutaneous", vaccinationDate: new Date("2024-11-13"), administeredBy: "Azeezat", nextDueDate: new Date("2025-11-13") },
    ];

    if (shouldSeed("vaccinationRecords")) {
      if (!Object.keys(animalMap).length) {
        const existingAnimals = await Animal.find({}, "_id tagId").lean();
        existingAnimals.forEach((a) => { animalMap[a.tagId] = a._id; });
      }
      for (const v of vaccinationData) {
        try {
          const animalId = animalMap[v.animalTag];
          if (!animalId) { results.errors.push(`Vaccination: Animal ${v.animalTag} not found`); continue; }
          await VaccinationRecord.create({ animal: animalId, vaccineName: v.vaccineName, dosage: v.dosage, method: v.method, vaccinationDate: v.vaccinationDate, administeredBy: v.administeredBy, nextDueDate: v.nextDueDate });
          results.vaccinationRecords++;
        } catch (err) {
          results.errors.push(`Vaccination for ${v.animalTag}: ${err.message}`);
        }
      }
    }

    res.status(200).json({ success: true, message: "Database seeded successfully", results });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message, results });
  }
}

export default withAuth(handler);
