import dbConnect from "@/lib/mongodb";
import Inventory from "@/models/Inventory";
import Medication from "@/models/Medication";
import InventoryCategory from "@/models/InventoryCategory";
import MedicationLookup from "@/models/MedicationLookup";

// Helper to parse expiration dates like "02/2029", "12/2027", "17/10/2027", etc.
function parseExpiration(exp) {
  if (!exp || typeof exp !== "string") return null;
  const trimmed = exp.trim();
  
  // Format: DD/MM/YYYY or D/MM/YYYY
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(trimmed)) {
    const [day, month, year] = trimmed.split("/");
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }
  
  // Format: MM/YYYY
  if (/^\d{1,2}\/\d{4}$/.test(trimmed)) {
    const [month, year] = trimmed.split("/");
    return new Date(parseInt(year), parseInt(month) - 1, 1);
  }
  
  // Format: DD/M/YYYY (28/12/204 - seems like typo for 2024)
  if (/^\d{1,2}\/\d{1,2}\/\d{3}$/.test(trimmed)) {
    const [day, month, year] = trimmed.split("/");
    return new Date(parseInt("20" + year), parseInt(month) - 1, parseInt(day));
  }
  
  return null;
}

const medicationsData = [
  { name: "Jubail Penstrep 100ml", expiration: "02/2029", classCategory: "Antibiotic", route: "IM", quantity: 1 },
  { name: "Jubail Albendazole bolus 600mg", expiration: "12/2027", classCategory: "Dewormer", route: "Oral", quantity: 1 },
  { name: "5&10ml Syringe", expiration: "04/2029", classCategory: "Syringe", route: "", quantity: 1 },
  { name: "Kepromec Ivermectin 50ml", expiration: "12/2027", classCategory: "Dewormer", route: "Subcutaneous", quantity: 1 },
  { name: "Jubail Levamisole 100ml", expiration: "03/2027", classCategory: "Dewormer", route: "Subcutaneous", quantity: 1 },
  { name: "Jubail Tylosine 100ml", expiration: "10/2027", classCategory: "Antibiotic", route: "IM", quantity: 1 },
  { name: "Jubail Iron 100ml", expiration: "01/2028", classCategory: "Iron Supplement", route: "IM", quantity: 1 },
  { name: "Kepro Penstrep", expiration: "06/2025", classCategory: "Antibiotic", route: "IM", quantity: 1 },
  { name: "Jubail Gentamicine 100ml", expiration: "05/2025", classCategory: "Antibiotic", route: "IM", quantity: 1 },
  { name: "Jubail Oxytet 5% 100ml", expiration: "02/2028", classCategory: "Antibiotic", route: "IM", quantity: 1 },
  { name: "Oxytocin10 Ampoule", expiration: "08/2025", classCategory: "Hormone", route: "IM", quantity: 1 },
  { name: "Oxytocin 50ml", expiration: "05/2026", classCategory: "Hormone", route: "IM", quantity: 1 },
  { name: "oxySpray 210ml", expiration: "04/2026", classCategory: "Antibiotic", route: "Topical", quantity: 1 },
  { name: "Tetranor spray 250ml", expiration: "09/2027", classCategory: "Antibiotic", route: "Topical", quantity: 1 },
  { name: "Pour On acaricide 210ml", expiration: "04/2026", classCategory: "Ectoparasites Control", route: "Topical", quantity: 1 },
  { name: "V.BNOr Vit.Bcomplex 10ml", expiration: "11/2027", classCategory: "Multivitamin", route: "", quantity: 1 },
  { name: "100ml VMultinor", expiration: "11/2027", classCategory: "Multivitamin", route: "IM", quantity: 1 },
  { name: "100ml Oxytet 20% L.A", expiration: "09/2027", classCategory: "Antibiotic", route: "IM", quantity: 1 },
  { name: "100ml sinoxy 20%LA", expiration: "03/2027", classCategory: "Antibiotic", route: "IM", quantity: 1 },
  { name: "100ml Sulfanor", expiration: "07/2028", classCategory: "Antibiotic", route: "IM", quantity: 1 },
  { name: "Amprolium WSP", expiration: "04/2026", classCategory: "Anticocci", route: "IM", quantity: 1 },
  { name: "Molasses", expiration: "", classCategory: "Feed Supplement", route: "Oral", quantity: 1 },
  { name: "Moosun-multivitamin 150g WSP", expiration: "17/10/2027", classCategory: "Immune Booster", route: "Oral", quantity: 1 },
  { name: "Ivermectin 1% 100ml", expiration: "03/2026", classCategory: "Dewormer", route: "Subcutaneous", quantity: 1 },
  { name: "Gadol 200ml", expiration: "04/2028", classCategory: "Ectoparasites Control", route: "Topical", quantity: 1 },
  { name: "2L Nino ethyl rubbing spirit 2L", expiration: "07/2027", classCategory: "Disinfectant", route: "", quantity: 1 },
  { name: "15ml Moko iodine", expiration: "05/2028", classCategory: "Disinfectant", route: "", quantity: 1 },
  { name: "Calcium gluconate 10amp", expiration: "05/2027", classCategory: "Calcium Supplement", route: "IV", quantity: 1 },
  { name: "Dexamore 100ml", expiration: "01/2027", classCategory: "Anti-inflammatory", route: "IM", quantity: 1 },
  { name: "Sulfamore 100ml", expiration: "01/2027", classCategory: "Antibiotic", route: "IM", quantity: 1 },
  { name: "Diastop 100ml", expiration: "05/2027", classCategory: "Antidiarrheal", route: "Oral", quantity: 1 },
  { name: "Diclofenac Sodium Inj. 10amp", expiration: "09/2027", classCategory: "Anti-inflammatory", route: "IM", quantity: 1 },
  { name: "Ampromore Wsp300mg", expiration: "11/2025", classCategory: "Anticocci", route: "Oral", quantity: 1 },
  { name: "ORS 20.5g", expiration: "09/01/2028", classCategory: "Rehydration Salt", route: "Oral", quantity: 1 },
  { name: "Baking soda 50g", expiration: "13/9/2026", classCategory: "Bloat Control", route: "Oral", quantity: 1 },
  { name: "Blended Charcoal", expiration: "", classCategory: "Toxin Binder", route: "Oral", quantity: 1 },
  { name: "Gentamicin Eye drops 10ml", expiration: "12/2025", classCategory: "Antibiotic", route: "Ophthalmic", quantity: 1 },
  { name: "Epsom salt", expiration: "12/2027", classCategory: "Salt", route: "", quantity: 1 },
  { name: "Ivermax 1Litre", expiration: "10/2026", classCategory: "Anti-parasite", route: "Subcutaneous", quantity: 1 },
  { name: "Duravet Colostrum Replacer", expiration: "14/2028", classCategory: "Colostrum", route: "Oral", quantity: 1 },
  { name: "Kyroligo 100ml", expiration: "01/2026", classCategory: "Vitamin & Mineral Supplement", route: "IM", quantity: 1 },
  { name: "Maxitet 23%LA 500ml", expiration: "12/2025", classCategory: "Antibiotic", route: "Subcutaneous", quantity: 1 },
  { name: "Ivermax+ADE 500ml", expiration: "02/2027", classCategory: "Anti-parasite + Vitamin", route: "Subcutaneous", quantity: 1 },
  { name: "Maxisulf LA 500ml", expiration: "09/2025", classCategory: "Antibiotic", route: "Subcutaneous", quantity: 1 },
  { name: "Oximycin 230La 500ml", expiration: "08/2025", classCategory: "Antibiotic", route: "IM", quantity: 1 },
  { name: "B-CO Bolic 500ml", expiration: "12/2025", classCategory: "Tonic", route: "Subcutaneous", quantity: 1 },
  { name: "Cotton wool 500g", expiration: "02/2029", classCategory: "Medical Supply", route: "", quantity: 1 },
  { name: "Hydrogen peroxide 200ml", expiration: "05/2027", classCategory: "Disinfectant", route: "", quantity: 1 },
  { name: "Diaoquench herbal wsp 25g", expiration: "10/7/2026", classCategory: "Antidiarrheal", route: "Oral", quantity: 1 },
  { name: "Electropower 100g Wsp", expiration: "09/2025", classCategory: "Electrolyte", route: "Oral", quantity: 1 },
  { name: "Vitamix 100g Wsp", expiration: "12/2025", classCategory: "Vitamin", route: "Oral", quantity: 1 },
  { name: "Electroguard NF gel 5L", expiration: "16/7/2025", classCategory: "Anti-stress", route: "Oral", quantity: 1 },
  { name: "Ovu-Min-Cu 5L", expiration: "28/12/2024", classCategory: "Anti-stress", route: "Oral", quantity: 1 },
  { name: "Immunovite 5L", expiration: "25/7/2025", classCategory: "Anti-stress", route: "Oral", quantity: 1 },
  { name: "Prodose Orange 5L", expiration: "01/2027", classCategory: "Dewormer", route: "Oral", quantity: 1 },
  { name: "Panacur Bs 5L", expiration: "10/2025", classCategory: "Dewormer", route: "Oral", quantity: 1 },
  { name: "Eradiworm 5L", expiration: "03/2027", classCategory: "Dewormer", route: "Oral", quantity: 1 },
  { name: "Saline water", expiration: "06/2027", classCategory: "Vaccine Diluent", route: "", quantity: 1 },
  { name: "Trace Minerals 11.33kg", expiration: "", classCategory: "Mineral Supplement", route: "", quantity: 1 },
];

// Non-medication inventory items (Feed, Equipment, Medical Supplies)
const otherInventoryData = [
  { name: "Feed", quantity: 10, category: "Feed", unit: "bags" },
  { name: "Goat brush", quantity: 20, category: "Equipment", unit: "pieces" },
  { name: "Gloves", quantity: 200, category: "Medical Supplies", unit: "pieces" },
  { name: "Groundnut Hay", quantity: 3, category: "Feed", unit: "bales" },
];

const categoriesData = [
  { name: "Medication", description: "Medications, drugs, vaccines, and pharmaceutical products" },
  { name: "Feed", description: "Animal feed, hay, supplements, and nutritional products" },
  { name: "Equipment", description: "Farm tools, machinery, and equipment" },
  { name: "Medical Supplies", description: "Syringes, gloves, bandages, and other medical consumables" },
];

const routesData = ["IM", "Oral", "Subcutaneous", "IV", "Topical", "Ophthalmic"];

const classCategories = [
  "Antibiotic",
  "Dewormer", 
  "Syringe",
  "Iron Supplement",
  "Hormone",
  "Ectoparasites Control",
  "Multivitamin",
  "Anticocci",
  "Feed Supplement",
  "Immune Booster",
  "Disinfectant",
  "Calcium Supplement",
  "Anti-inflammatory",
  "Antidiarrheal",
  "Rehydration Salt",
  "Bloat Control",
  "Toxin Binder",
  "Salt",
  "Anti-parasite",
  "Colostrum",
  "Vitamin & Mineral Supplement",
  "Anti-parasite + Vitamin",
  "Tonic",
  "Medical Supply",
  "Electrolyte",
  "Vitamin",
  "Anti-stress",
  "Vaccine Diluent",
  "Mineral Supplement",
];

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    await dbConnect();

    const results = {
      categoriesCreated: 0,
      lookupsCreated: 0,
      inventoryCleared: 0,
      medicationsCleared: 0,
      inventoryCreated: 0,
      medicationsCreated: 0,
    };

    // 1. Clear existing inventory and medications
    const inventoryDeleted = await Inventory.deleteMany({});
    results.inventoryCleared = inventoryDeleted.deletedCount;

    const medicationsDeleted = await Medication.deleteMany({});
    results.medicationsCleared = medicationsDeleted.deletedCount;

    // 2. Clear and recreate categories
    await InventoryCategory.deleteMany({});
    for (const cat of categoriesData) {
      await InventoryCategory.findOneAndUpdate(
        { name: cat.name },
        { name: cat.name, description: cat.description },
        { upsert: true, new: true }
      );
      results.categoriesCreated++;
    }

    // 3. Clear and recreate medication lookups
    await MedicationLookup.deleteMany({});
    
    // Add routes
    for (const route of routesData) {
      if (route) {
        await MedicationLookup.findOneAndUpdate(
          { type: "route", value: route },
          { type: "route", value: route },
          { upsert: true, new: true }
        );
        results.lookupsCreated++;
      }
    }

    // Add class categories
    for (const cls of classCategories) {
      if (cls) {
        await MedicationLookup.findOneAndUpdate(
          { type: "classCategory", value: cls },
          { type: "classCategory", value: cls },
          { upsert: true, new: true }
        );
        results.lookupsCreated++;
      }
    }

    // 4. Get the Medication category ID
    const medicationCategory = await InventoryCategory.findOne({ name: "Medication" });

    // 5. Create inventory items and medications
    for (const med of medicationsData) {
      const expirationDate = parseExpiration(med.expiration);
      
      const inventoryItem = await Inventory.create({
        item: med.name,
        quantity: med.quantity,
        category: "Medication",
        categoryId: medicationCategory?._id,
        categoryName: "Medication",
        unit: "unit",
        medication: {
          details: "",
          expiration: expirationDate,
          classCategory: med.classCategory,
          purpose: "",
          recommendedDosage: "",
          route: med.route,
          supplier: "",
        },
        dateAdded: new Date(),
      });
      results.inventoryCreated++;

      await Medication.create({
        name: med.name,
        details: "",
        expiration: expirationDate,
        classCategory: med.classCategory,
        purpose: "",
        recommendedDosage: "",
        route: med.route,
        supplier: "",
        inventoryItem: inventoryItem._id,
      });
      results.medicationsCreated++;
    }

    // 6. Create non-medication inventory items (Feed, Equipment, Medical Supplies)
    for (const item of otherInventoryData) {
      // Skip if it's medication (already handled above)
      if (item.category === "Medication") continue;
      
      const category = await InventoryCategory.findOne({ name: item.category });
      
      await Inventory.create({
        item: item.name,
        quantity: item.quantity,
        category: item.category,
        categoryId: category?._id,
        categoryName: item.category,
        unit: item.unit || "unit",
        dateAdded: new Date(),
      });
      results.inventoryCreated++;
    }

    return res.status(200).json({
      success: true,
      message: "Inventory seeded successfully",
      results,
    });
  } catch (error) {
    console.error("Seed error:", error);
    return res.status(500).json({ error: error.message });
  }
}
