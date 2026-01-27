import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import Animal from "../models/Animal.js";
import User from "../models/User.js";
import Medication from "../models/Medication.js";
import Inventory from "../models/Inventory.js";
import Finance from "../models/Finance.js";
import Location from "../models/Location.js";
import BusinessSettings from "../models/BusinessSettings.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env.local") });

const MONGODB_URI = process.env.MONGODB_URI;

async function dbConnect() {
  if (mongoose.connection.readyState >= 1) return;
  return mongoose.connect(MONGODB_URI);
}

async function seed() {
  try {
    await dbConnect();

    // --- CLEAR EXISTING DATA ---
    await Animal.deleteMany({});
    await User.deleteMany({});
    await Medication.deleteMany({});
    await Inventory.deleteMany({});
    await Finance.deleteMany({});
    await Location.deleteMany({});
    await BusinessSettings.deleteMany({});

    console.log("Old data cleared.");

    // --- SEED USERS (PIN-only authentication) ---
    const users = [
      { 
        name: "Super Admin", 
        email: "admin@farm.com", 
        pin: "1234",
        role: "SuperAdmin",
        phone: "+234-800-000-0001",
        isActive: true
      },
      { 
        name: "Farm Manager", 
        email: "manager@farm.com", 
        pin: "5678",
        role: "Manager",
        phone: "+234-800-000-0002",
        isActive: true
      },
      { 
        name: "Farm Attendant", 
        email: "attendant@farm.com", 
        pin: "9012",
        role: "Attendant",
        phone: "+234-800-000-0003",
        isActive: true
      }
    ];
    await User.insertMany(users);
    console.log("Users seeded (PIN-only system).");
    console.log("  - Admin: admin@farm.com / PIN: 1234");
    console.log("  - Manager: manager@farm.com / PIN: 5678");
    console.log("  - Attendant: attendant@farm.com / PIN: 9012");

    // --- SEED LOCATIONS ---
    const locations = [
      {
        name: "Main Farm",
        description: "Primary farming location with main operations",
        address: "123 Farm Lane",
        city: "Lagos",
        state: "Lagos",
        isActive: true
      },
      {
        name: "Annex Farm",
        description: "Secondary location for overflow livestock",
        address: "456 Rural Road",
        city: "Ogun",
        state: "Ogun",
        isActive: true
      },
      {
        name: "Breeding Center",
        description: "Dedicated breeding and genetic improvement facility",
        address: "789 Pastoral Way",
        city: "Osun",
        state: "Osun",
        isActive: true
      }
    ];
    const savedLocations = await Location.insertMany(locations);
    console.log("Locations seeded.");

    // --- SEED BUSINESS SETTINGS ---
    const admin = await User.findOne({ role: "SuperAdmin" });
    await BusinessSettings.create({
      businessName: "Farm Health Management System",
      businessEmail: "info@farmhealth.com",
      businessPhone: "+234-XXX-XXX-XXXX",
      businessAddress: "123 Farm Lane, Lagos, Nigeria",
      businessDescription: "Comprehensive farm health and operations management system for livestock farming",
      currency: "NGN",
      timezone: "UTC+1",
      owner: admin?._id
    });
    console.log("Business settings seeded.");

    // --- SEED ANIMALS ---
    const animals = [
      {
        tagId: "BGM001",
        myNotes: "Stud male",
        name: "Gentle Kay",
        species: "Goat",
        breed: "Boer",
        origin: "South Africa",
        class: "Stud",
        gender: "Male",
        dob: new Date("2023-05-20"),
        acquisitionType: "Imported",
        acquisitionDate: new Date("2024-10-12"),
        status: "Alive",
        location: savedLocations[0]._id,
        paddock: "Isolation",
        weight: undefined,
        weightDate: undefined,
        recordedBy: "Azeezat",
        notes: "Good breeding potential",
        sireId: undefined,
        damId: undefined,
        weightHistory: [],
        feedingHistory: [],
        treatmentHistory: []
      },
      {
        tagId: "BGF001",
        myNotes: "Mum of 2",
        name: "Wisdom",
        species: "Goat",
        breed: "Boer",
        origin: "South Africa",
        class: "Stud",
        gender: "Female",
        dob: new Date("2024-11-02"),
        acquisitionType: "Imported",
        acquisitionDate: new Date("2024-10-13"),
        status: "Alive",
        location: savedLocations[0]._id,
        paddock: "RP1",
        weight: undefined,
        weightDate: undefined,
        recordedBy: "Azeezat",
        notes: "",
        sireId: undefined,
        damId: undefined,
        weightHistory: [],
        feedingHistory: [],
        treatmentHistory: []
      },
      {
        tagId: "BGF002",
        name: "Queen",
        species: "Goat",
        breed: "Boer",
        gender: "Female",
        dob: new Date("2023-03-15"),
        acquisitionType: "Bred on farm",
        acquisitionDate: new Date("2023-03-15"),
        status: "Alive",
        location: savedLocations[1]._id,
        paddock: "RP2",
        notes: "High milk production",
        weightHistory: [],
        feedingHistory: [],
        treatmentHistory: []
      }
    ];
    await Animal.insertMany(animals);
    console.log("Animals seeded.");

    // --- SEED MEDICATIONS ---
    const medications = [
      { 
        name: "Jubail Penstrep 100ml", 
        category: "Antibiotic", 
        purpose: "Treatment", 
        expiration: new Date("2029-02-01"),
        details: "Penicillin streptomycin combination"
      },
      { 
        name: "Kepromec Ivermectin 50ml", 
        category: "Dewormer", 
        purpose: "Deworming", 
        expiration: new Date("2027-12-01"),
        details: "Broad spectrum antiparasitic"
      },
      { 
        name: "Pour On acaricide 210ml", 
        category: "Ectoparasite Control", 
        purpose: "External parasite", 
        expiration: new Date("2026-04-01"),
        details: "Tick and mite control"
      },
      { 
        name: "100ml VMultinor", 
        category: "Multivitamin", 
        purpose: "Vitamin supplement", 
        expiration: new Date("2027-11-01"),
        details: "Complete vitamin and mineral supplement"
      },
      { 
        name: "Oxytet 20%", 
        category: "Antibiotic", 
        purpose: "Treatment", 
        expiration: new Date("2027-09-01"),
        details: "Oxytetracycline antibiotic"
      }
    ];
    await Medication.insertMany(medications);
    console.log("Medications seeded.");

    // --- SEED INVENTORY ---
    const inventoryItems = [
      { 
        item: "Oxytet 20%", 
        quantity: 1, 
        category: "Medication", 
        dateAdded: new Date("2024-10-14") 
      },
      { 
        item: "Multivitamin 100ml", 
        quantity: 100, 
        category: "Medication", 
        dateAdded: new Date("2024-10-14") 
      },
      { 
        item: "Feeding bottles", 
        quantity: 15, 
        category: "Equipment", 
        dateAdded: new Date("2024-10-14") 
      },
      { 
        item: "Syringes", 
        quantity: 50, 
        category: "Medical Supplies", 
        dateAdded: new Date("2024-10-14") 
      }
    ];
    await Inventory.insertMany(inventoryItems);
    console.log("Inventory seeded.");

    // --- SEED FINANCE ---
    const finances = [
      { 
        date: new Date("2025-08-31"), 
        month: "August", 
        title: "Feed TF to AnnexFarm", 
        description: "Feed TF to AnnexFarm", 
        category: "Feed", 
        amount: 500, 
        status: "Completed", 
        notes: "" 
      },
      { 
        date: new Date("2025-08-31"), 
        month: "August", 
        title: "Fuel for Wisdom", 
        description: "Fuel for Wisdom", 
        category: "Other", 
        amount: 1000, 
        status: "Completed", 
        notes: "" 
      },
      { 
        date: new Date("2025-09-02"), 
        month: "September", 
        title: "Monthly Data", 
        description: "Monthly Data", 
        category: "Other", 
        amount: 5000, 
        status: "Completed", 
        notes: "" 
      },
      { 
        date: new Date("2025-09-02"), 
        month: "September", 
        title: "Annex farm Gas refill", 
        description: "Annex farm Gas refill", 
        category: "Other", 
        amount: 3900, 
        status: "Completed", 
        notes: "" 
      },
      { 
        date: new Date("2025-09-04"), 
        month: "September", 
        title: "Packing of Raised Pen (3pen)", 
        description: "Packing of Raised Pen (3pen)", 
        category: "Other", 
        amount: 2000, 
        status: "Completed", 
        notes: "" 
      }
    ];
    await Finance.insertMany(finances);
    console.log("Finance records seeded.");

    // --- SEED WEIGHT HISTORY ---
    await Animal.updateOne(
      { tagId: "BGM001" },
      { $push: { weightHistory: { date: new Date("2024-11-05"), weightKg: 2.75, recordedBy: "Azeezat" } } }
    );
    await Animal.updateOne(
      { tagId: "BGF001" },
      { $push: { weightHistory: { date: new Date("2024-11-05"), weightKg: 2.62, recordedBy: "Azeezat" } } }
    );
    await Animal.updateOne(
      { tagId: "BGF002" },
      { $push: { weightHistory: { date: new Date("2024-11-05"), weightKg: 3.15, recordedBy: "Azeezat" } } }
    );
    console.log("Weight history seeded.");

    // --- SEED TREATMENT HISTORY ---
    const treatmentHistory = [
      {
        date: new Date("2024-10-12"),
        symptoms: "Emaciation",
        possibleCause: "Poor nutrition",
        diagnosis: "Malnutrition",
        treatmentType: "Vitamin Dosing",
        medication: { name: "100ml VMultinor", dosage: "2ml", route: "IM" },
        treatedBy: "Azeezat",
        postTreatmentObservation: "Improved appetite",
        treatmentCompletionDate: new Date("2024-10-14"),
        recoveryStatus: "Recovered"
      },
      {
        date: new Date("2024-10-13"),
        symptoms: "Watery feces",
        possibleCause: "Bacterial infection",
        diagnosis: "Diarrhea",
        treatmentType: "Antibiotics",
        medication: { name: "100ml Sulfanor", dosage: "4ml", route: "IM" },
        treatedBy: "Azeezat",
        postTreatmentObservation: "Stool consistency improved",
        treatmentCompletionDate: new Date("2024-10-17"),
        recoveryStatus: "Recovered"
      }
    ];
    await Animal.updateOne({ tagId: "BGF001" }, { $push: { treatmentHistory: { $each: treatmentHistory } } });
    console.log("Treatment history seeded.");

    // --- SEED FEEDING HISTORY ---
    const feedingHistory = [
      {
        date: new Date("2024-10-14"),
        feedCategory: "TF",
        quantityOffered: 1,
        quantityConsumed: 1,
        feedingMethod: "Manual",
        notes: "Normal feeding"
      },
      {
        date: new Date("2024-10-15"),
        feedCategory: "Concentrate",
        quantityOffered: 0.5,
        quantityConsumed: 0.5,
        feedingMethod: "Manual",
        notes: "Good appetite"
      }
    ];
    await Animal.updateOne({ tagId: "BGF001" }, { $push: { feedingHistory: { $each: feedingHistory } } });
    console.log("Feeding history seeded.");

    // --- SEED VACCINATION HISTORY ---
    const vaccinationRecords = [
      {
        vaccineName: "Enterotoxemia vaccine",
        method: "IM",
        dosage: "1ml",
        vaccinationDate: new Date("2024-10-10")
      }
    ];
    await Animal.updateOne({ tagId: "BGM001" }, { $push: { vaccinationRecords: { $each: vaccinationRecords } } });
    console.log("Vaccination history seeded.");

    console.log("✓ Seeding complete. Database is ready.");
    process.exit(0);
  } catch (err) {
    console.error("✗ Error seeding data:", err);
    process.exit(1);
  }
}

seed();
