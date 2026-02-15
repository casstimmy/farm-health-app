import dbConnect from "@/lib/mongodb";
import Animal from "@/models/Animal";
import Treatment from "@/models/Treatment";
import FeedType from "@/models/FeedType";
import FeedingRecord from "@/models/FeedingRecord";
import WeightRecord from "@/models/WeightRecord";
import VaccinationRecord from "@/models/VaccinationRecord";
import BreedingRecord from "@/models/BreedingRecord";
import MortalityRecord from "@/models/MortalityRecord";
import Inventory from "@/models/Inventory";
import InventoryCategory from "@/models/InventoryCategory";
import Finance from "@/models/Finance";
import { withAuth } from "@/utils/middleware";

async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Only SuperAdmin can seed
  if (req.user?.role !== "SuperAdmin") {
    return res
      .status(403)
      .json({ error: "Forbidden: Only SuperAdmin can seed data" });
  }

  await dbConnect();

  const results = {
    inventoryCategories: 0,
    inventoryItems: 0,
    feedTypes: 0,
    animals: 0,
    treatments: 0,
    feedingRecords: 0,
    weightRecords: 0,
    vaccinationRecords: 0,
    breedingRecords: 0,
    mortalityRecords: 0,
    financialTransactions: 0,
    errors: [],
  };

  try {
    // ─── 1. Inventory Categories ───
    const categoryData = [
      { name: "Medication", description: "Veterinary drugs and treatments" },
      { name: "Feed", description: "Animal feed supplies" },
      { name: "Equipment", description: "Farm equipment and tools" },
    ];

    const categoryMap = {};
    for (const cat of categoryData) {
      try {
        let existing = await InventoryCategory.findOne({ name: cat.name });
        if (!existing) {
          existing = await InventoryCategory.create(cat);
          results.inventoryCategories++;
        }
        categoryMap[cat.name] = existing._id;
      } catch (err) {
        results.errors.push(`Category ${cat.name}: ${err.message}`);
      }
    }

    // ─── 2. Inventory Items ───
    const inventoryData = [
      {
        item: "Ivermectin Injectable",
        quantity: 30,
        unit: "Bottle",
        categoryName: "Medication",
        minStock: 5,
        price: 4500,
        expiration: new Date("2027-10-17"),
        supplier: "FarmVet Supplies",
      },
      {
        item: "Oxytetracycline",
        quantity: 20,
        unit: "Bottle",
        categoryName: "Medication",
        minStock: 3,
        price: 5200,
        expiration: new Date("2028-06-30"),
        supplier: "AgroVet Nigeria",
      },
      {
        item: "Premium Goat Feed",
        quantity: 100,
        unit: "Bag",
        categoryName: "Feed",
        minStock: 20,
        price: 8500,
        expiration: new Date("2026-12-01"),
        supplier: "GreenFeeds Ltd",
      },
    ];

    const inventoryMap = {};
    for (const inv of inventoryData) {
      try {
        let existing = await Inventory.findOne({ item: inv.item });
        if (!existing) {
          existing = await Inventory.create({
            item: inv.item,
            quantity: inv.quantity,
            unit: inv.unit,
            category: inv.categoryName,
            categoryId: categoryMap[inv.categoryName] || null,
            categoryName: inv.categoryName,
            price: inv.price,
            minStock: inv.minStock,
            expiration: inv.expiration,
            supplier: inv.supplier,
            dateAdded: new Date(),
          });
          results.inventoryItems++;
        }
        inventoryMap[inv.item] = existing._id;
      } catch (err) {
        results.errors.push(`Inventory ${inv.item}: ${err.message}`);
      }
    }

    // ─── 3. Feed Types ───
    const feedTypeData = [
      {
        name: "Hay",
        category: "Forage",
        purpose: "Roughage and fiber",
        method: "Free-feeding",
        description: "Dried grass or legume forage",
      },
      {
        name: "Concentrate Mix",
        category: "Concentrate",
        purpose: "Energy and protein supplement",
        method: "Measured feeding",
        description: "Formulated grain and supplement mix",
      },
      {
        name: "Silage",
        category: "Forage",
        purpose: "Fermented roughage",
        method: "Trough feeding",
        description: "Fermented green forage",
      },
      {
        name: "Mineral Lick",
        category: "Supplement",
        purpose: "Mineral supplementation",
        method: "Free-access block",
        description: "Mineral and salt block",
      },
    ];

    const feedTypeMap = {};
    for (const ft of feedTypeData) {
      try {
        let existing = await FeedType.findOne({ name: ft.name });
        if (!existing) {
          existing = await FeedType.create(ft);
          results.feedTypes++;
        }
        feedTypeMap[ft.name] = existing._id;
      } catch (err) {
        results.errors.push(`FeedType ${ft.name}: ${err.message}`);
      }
    }

    // ─── 4. Animals ───
    const animalData = [
      {
        tagId: "GOAT-001",
        name: "Bella",
        species: "Goat",
        breed: "Boer",
        gender: "Female",
        dob: new Date("2023-05-12"),
        status: "Alive",
        currentWeight: 35,
        acquisitionType: "Bred on farm",
      },
      {
        tagId: "GOAT-002",
        name: "Max",
        species: "Goat",
        breed: "Boer",
        gender: "Male",
        dob: new Date("2022-08-20"),
        status: "Alive",
        currentWeight: 48,
        acquisitionType: "Purchased",
      },
      {
        tagId: "GOAT-003",
        name: "Daisy",
        species: "Goat",
        breed: "West African Dwarf",
        gender: "Female",
        dob: new Date("2024-01-15"),
        status: "Alive",
        currentWeight: 22,
        acquisitionType: "Bred on farm",
      },
    ];

    const animalMap = {};
    for (const a of animalData) {
      try {
        let existing = await Animal.findOne({ tagId: a.tagId });
        if (!existing) {
          existing = await Animal.create(a);
          results.animals++;
        }
        animalMap[a.tagId] = existing._id;
      } catch (err) {
        results.errors.push(`Animal ${a.tagId}: ${err.message}`);
      }
    }

    // ─── 5. Treatments ───
    const treatmentData = [
      {
        animalTag: "GOAT-001",
        date: new Date("2026-01-10"),
        symptoms: "Loss of appetite, diarrhea",
        diagnosis: "Worm infestation",
        prescribedDays: 3,
        medicationName: "Ivermectin Injectable",
        dosage: "2ml",
        route: "IM",
        recoveryStatus: "Recovered",
        treatedBy: "Farm Manager",
      },
      {
        animalTag: "GOAT-003",
        date: new Date("2026-01-20"),
        symptoms: "Fever and nasal discharge",
        diagnosis: "Respiratory infection",
        prescribedDays: 5,
        medicationName: "Oxytetracycline",
        dosage: "3ml",
        route: "IM",
        recoveryStatus: "Improving",
        treatedBy: "Farm Vet",
      },
    ];

    for (const t of treatmentData) {
      try {
        const animalId = animalMap[t.animalTag];
        if (!animalId) {
          results.errors.push(`Treatment: Animal ${t.animalTag} not found`);
          continue;
        }
        await Treatment.create({
          animal: animalId,
          date: t.date,
          symptoms: t.symptoms,
          diagnosis: t.diagnosis,
          prescribedDays: t.prescribedDays,
          medication: inventoryMap[t.medicationName] || null,
          medicationName: t.medicationName,
          dosage: t.dosage,
          route: t.route,
          recoveryStatus: t.recoveryStatus,
          treatedBy: t.treatedBy,
        });
        results.treatments++;
      } catch (err) {
        results.errors.push(`Treatment for ${t.animalTag}: ${err.message}`);
      }
    }

    // ─── 6. Feeding Records ───
    const feedingData = [
      {
        animalTag: "GOAT-001",
        feedTypeName: "Hay",
        quantityOffered: 2,
        quantityConsumed: 1.8,
        date: new Date("2026-01-10"),
      },
      {
        animalTag: "GOAT-003",
        feedTypeName: "Concentrate Mix",
        quantityOffered: 1.5,
        quantityConsumed: 1.4,
        date: new Date("2026-01-20"),
      },
    ];

    for (const f of feedingData) {
      try {
        const animalId = animalMap[f.animalTag];
        if (!animalId) {
          results.errors.push(`Feeding: Animal ${f.animalTag} not found`);
          continue;
        }
        await FeedingRecord.create({
          animal: animalId,
          feedType: feedTypeMap[f.feedTypeName] || null,
          feedTypeName: f.feedTypeName,
          quantityOffered: f.quantityOffered,
          quantityConsumed: f.quantityConsumed,
          date: f.date,
        });
        results.feedingRecords++;
      } catch (err) {
        results.errors.push(`Feeding for ${f.animalTag}: ${err.message}`);
      }
    }

    // ─── 7. Weight Records ───
    const weightData = [
      {
        animalTag: "GOAT-001",
        weightKg: 36,
        date: new Date("2026-02-01"),
        recordedBy: "Farm Manager",
      },
      {
        animalTag: "GOAT-003",
        weightKg: 23,
        date: new Date("2026-02-01"),
        recordedBy: "Farm Assistant",
      },
    ];

    for (const w of weightData) {
      try {
        const animalId = animalMap[w.animalTag];
        if (!animalId) {
          results.errors.push(`Weight: Animal ${w.animalTag} not found`);
          continue;
        }
        await WeightRecord.create({
          animal: animalId,
          weightKg: w.weightKg,
          date: w.date,
          recordedBy: w.recordedBy,
        });
        results.weightRecords++;
      } catch (err) {
        results.errors.push(`Weight for ${w.animalTag}: ${err.message}`);
      }
    }

    // ─── 8. Vaccination Records ───
    const vaccinationData = [
      {
        animalTag: "GOAT-001",
        vaccineName: "PPR Vaccine",
        dosage: "1ml",
        method: "Subcutaneous",
        vaccinationDate: new Date("2025-12-01"),
        administeredBy: "Farm Vet",
        nextDueDate: new Date("2026-12-01"),
      },
      {
        animalTag: "GOAT-002",
        vaccineName: "PPR Vaccine",
        dosage: "1ml",
        method: "Subcutaneous",
        vaccinationDate: new Date("2025-12-01"),
        administeredBy: "Farm Vet",
        nextDueDate: new Date("2026-12-01"),
      },
    ];

    for (const v of vaccinationData) {
      try {
        const animalId = animalMap[v.animalTag];
        if (!animalId) {
          results.errors.push(`Vaccination: Animal ${v.animalTag} not found`);
          continue;
        }
        await VaccinationRecord.create({
          animal: animalId,
          vaccineName: v.vaccineName,
          dosage: v.dosage,
          method: v.method,
          vaccinationDate: v.vaccinationDate,
          administeredBy: v.administeredBy,
          nextDueDate: v.nextDueDate,
        });
        results.vaccinationRecords++;
      } catch (err) {
        results.errors.push(
          `Vaccination for ${v.animalTag}: ${err.message}`
        );
      }
    }

    // ─── 9. Breeding Records ───
    const breedingData = [
      {
        breedingId: "BR-2026-001",
        species: "Goat",
        doeTag: "GOAT-001",
        buckTag: "GOAT-002",
        matingDate: new Date("2026-01-05"),
        breedingType: "Natural",
        pregnancyStatus: "Confirmed",
        expectedDueDate: new Date("2026-06-05"),
        kidsAlive: 0,
        kidsDead: 0,
      },
    ];

    for (const b of breedingData) {
      try {
        const doe = animalMap[b.doeTag];
        const buck = animalMap[b.buckTag];
        if (!doe || !buck) {
          results.errors.push(
            `Breeding: doe ${b.doeTag} or buck ${b.buckTag} not found`
          );
          continue;
        }
        let existing = await BreedingRecord.findOne({
          breedingId: b.breedingId,
        });
        if (!existing) {
          await BreedingRecord.create({
            breedingId: b.breedingId,
            species: b.species,
            doe,
            buck,
            matingDate: b.matingDate,
            breedingType: b.breedingType,
            pregnancyStatus: b.pregnancyStatus,
            expectedDueDate: b.expectedDueDate,
            kidsAlive: b.kidsAlive,
            kidsDead: b.kidsDead,
          });
          results.breedingRecords++;
        }
      } catch (err) {
        results.errors.push(
          `Breeding ${b.breedingId}: ${err.message}`
        );
      }
    }

    // ─── 10. Mortality Records ───
    const mortalityData = [
      {
        animalTag: "GOAT-003",
        dateOfDeath: new Date("2026-03-01"),
        cause: "Severe pneumonia",
        symptoms: "Labored breathing, fever, nasal discharge",
        daysSick: 7,
        weight: 23,
        estimatedValue: 45000,
        disposalMethod: "Burial",
        reportedBy: "Farm Manager",
      },
    ];

    for (const m of mortalityData) {
      try {
        const animalId = animalMap[m.animalTag];
        if (!animalId) {
          results.errors.push(`Mortality: Animal ${m.animalTag} not found`);
          continue;
        }
        // Post-save hook will set Animal.status = "Dead"
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
        });
        results.mortalityRecords++;
      } catch (err) {
        results.errors.push(`Mortality for ${m.animalTag}: ${err.message}`);
      }
    }

    // ─── 11. Financial Transactions ───
    const financeData = [
      {
        date: new Date("2026-01-10"),
        type: "Expense",
        category: "Medication",
        title: "Purchased Ivermectin Injectable",
        description: "Purchased Ivermectin Injectable",
        amount: 135000,
      },
      {
        date: new Date("2026-02-15"),
        type: "Income",
        category: "Animal Sale",
        title: "Sold 1 mature goat",
        description: "Sold 1 mature goat",
        amount: 120000,
      },
    ];

    for (const f of financeData) {
      try {
        await Finance.create({
          date: f.date,
          type: f.type,
          category: f.category,
          title: f.title,
          description: f.description,
          amount: f.amount,
          status: "Completed",
        });
        results.financialTransactions++;
      } catch (err) {
        results.errors.push(`Finance ${f.title}: ${err.message}`);
      }
    }

    res.status(200).json({
      success: true,
      message: "Database seeded successfully",
      results,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      results,
    });
  }
}

export default withAuth(handler);
