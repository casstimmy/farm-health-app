import mongoose from "mongoose";
import bcrypt from "bcryptjs";
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

    // --- SEED BUSINESS SETTINGS ---
    const businessSettings = await BusinessSettings.create({
      businessName: "Main Goat Farm",
      email: "info@goatfarm.com",
      phone: "+234-XXX-XXX-XXXX",
      address: "Main Goat Farm",
      description: "Sustainable goat farming operation",
      currency: "NGN",
      timezone: "UTC+1"
    });
    console.log("✓ Business settings created");

    // --- SEED LOCATIONS ---
    const locations = await Location.insertMany([
      {
        name: "Main Goat Farm",
        description: "Main facility",
        address: "Main Goat Farm",
        city: "Main Location",
        state: "State",
        coordinates: { latitude: 0, longitude: 0 },
        isActive: true
      },
      {
        name: "Isolation",
        description: "Isolation unit for sick animals",
        address: "Isolation Section",
        city: "Main Location",
        state: "State",
        coordinates: { latitude: 0, longitude: 0 },
        isActive: true
      },
      {
        name: "RP1",
        description: "Rearing Paddock 1",
        address: "RP1",
        city: "Main Location",
        state: "State",
        coordinates: { latitude: 0, longitude: 0 },
        isActive: true
      }
    ]);
    console.log("✓ Locations created");

    // --- SEED USERS ---
    const hashedPasswordAdmin = await bcrypt.hash("admin123", 10);
    const hashedPasswordManager = await bcrypt.hash("manager123", 10);
    const hashedPasswordAttendant = await bcrypt.hash("attendant123", 10);

    const users = await User.insertMany([
      { 
        name: "Super Admin", 
        email: "admin@farm.com", 
        password: hashedPasswordAdmin, 
        role: "SuperAdmin" 
      },
      { 
        name: "Manager", 
        email: "manager@farm.com", 
        password: hashedPasswordManager, 
        role: "Manager" 
      },
      { 
        name: "Azeezat", 
        email: "attendant@farm.com", 
        password: hashedPasswordAttendant, 
        role: "Attendant" 
      }
    ]);
    console.log("✓ Users created");

    // --- SEED ANIMALS ---
    const animals = await Animal.insertMany([
      {
        tagId: "BGM001",
        animalId: "BGM001",
        name: "Gentle Kay",
        species: "Goat",
        breed: "Boer",
        origin: "South Africa",
        class: "Stud",
        gender: "Male",
        dob: new Date("2023-05-20"),
        acquisitionType: "Imported",
        acquisitionDate: new Date("2024-10-12"),
        sireId: null,
        damId: null,
        status: "Alive",
        location: locations[0]._id,
        paddock: "Isolation",
        weight: 0,
        weightDate: new Date(),
        recordedBy: "Azeezat",
        notes: "Good breeding potential",
        healthRecords: []
      },
      {
        tagId: "BGF001",
        animalId: "BGF001",
        name: "Wisdom",
        species: "Goat",
        breed: "Boer",
        origin: "South Africa",
        class: "Stud",
        gender: "Female",
        dob: new Date("2024-11-02"),
        acquisitionType: "Imported",
        acquisitionDate: new Date("2024-10-13"),
        sireId: "BGM001",
        damId: null,
        status: "Alive",
        location: locations[0]._id,
        paddock: "RP1",
        weight: 0,
        weightDate: new Date(),
        recordedBy: "Azeezat",
        notes: "Mum of 2",
        healthRecords: []
      },
      {
        tagId: "SGF001",
        animalId: "SGF001",
        name: "SGF001",
        species: "Goat",
        breed: "Sahel",
        origin: "Local",
        class: "Female",
        gender: "Female",
        dob: new Date("2024-01-01"),
        acquisitionType: "Local",
        acquisitionDate: new Date("2024-10-12"),
        sireId: null,
        damId: null,
        status: "Alive",
        location: locations[0]._id,
        paddock: "Main",
        weight: 0,
        weightDate: new Date(),
        recordedBy: "Azeezat",
        notes: "Sahel breed",
        healthRecords: [
          {
            date: new Date("2024-10-12"),
            symptoms: "Emaciation",
            diagnosis: "Vitamin Deficiency",
            prescribedTreatment: "Vitamin Dosing",
            medication: "VMultinor",
            dosage: "2ml",
            route: "IM",
            treatedBy: "Azeezat",
            treatmentCompletionDate: new Date("2024-10-14"),
            recoveryStatus: "Recovered"
          },
          {
            date: new Date("2024-10-13"),
            symptoms: "watery feaces",
            diagnosis: "Diarrhea",
            prescribedTreatment: "Antibiotics",
            medication: "Sulfanor",
            dosage: "4ml",
            route: "IM",
            treatedBy: "Azeezat",
            treatmentCompletionDate: new Date("2024-10-17"),
            recoveryStatus: "Recovered"
          },
          {
            date: new Date("2024-10-18"),
            symptoms: "Watery feaces",
            diagnosis: "Diarrhea",
            prescribedTreatment: "Deworming",
            medication: "Kepromec Ivermectin",
            dosage: "0.5ml",
            route: "Subcutaneous",
            treatedBy: "Azeezat",
            treatmentCompletionDate: new Date("2024-10-23"),
            recoveryStatus: "Recovered"
          },
          {
            date: new Date("2024-10-27"),
            symptoms: "Watery feaces",
            diagnosis: "Diarrhea",
            prescribedTreatment: "Deworming",
            medication: "Jubail Levamisole",
            dosage: "1ml",
            route: "Subcutaneous",
            treatedBy: "Azeezat",
            treatmentCompletionDate: new Date("2024-10-27"),
            recoveryStatus: "Recovered"
          }
        ]
      },
      {
        tagId: "BGF002",
        animalId: "BGF002",
        name: "BGF002",
        species: "Goat",
        breed: "Boer",
        origin: "Local",
        class: "Female",
        gender: "Female",
        dob: new Date("2024-01-01"),
        acquisitionType: "Local",
        acquisitionDate: new Date("2024-10-12"),
        sireId: null,
        damId: null,
        status: "Alive",
        location: locations[0]._id,
        paddock: "Main",
        weight: 0,
        weightDate: new Date(),
        recordedBy: "Azeezat",
        notes: "Boer breed",
        healthRecords: [
          {
            date: new Date("2024-10-23"),
            symptoms: "Body scratching against wall",
            diagnosis: "Lice",
            prescribedTreatment: "Pour On acaricide",
            medication: "acaricide",
            dosage: "5ml",
            route: "Backline",
            treatedBy: "Azeezat",
            treatmentCompletionDate: new Date("2024-10-23"),
            recoveryStatus: "Recovered"
          }
        ]
      },
      {
        tagId: "BGKM001",
        animalId: "BGKM001",
        name: "KKM",
        species: "Goat",
        breed: "Boer",
        origin: "Local",
        class: "Kid",
        gender: "Male",
        dob: new Date("2024-11-05"),
        acquisitionType: "Born",
        acquisitionDate: new Date("2024-11-05"),
        sireId: "BGM001",
        damId: "BGF001",
        status: "Alive",
        location: locations[0]._id,
        paddock: "Main",
        weight: 2.75,
        weightDate: new Date("2024-11-05"),
        recordedBy: "Azeezat",
        notes: "3 days old",
        healthRecords: []
      },
      {
        tagId: "BGKF001",
        animalId: "BGKF001",
        name: "KKF",
        species: "Goat",
        breed: "Boer",
        origin: "Local",
        class: "Kid",
        gender: "Female",
        dob: new Date("2024-11-05"),
        acquisitionType: "Born",
        acquisitionDate: new Date("2024-11-05"),
        sireId: "BGM001",
        damId: "BGF001",
        status: "Alive",
        location: locations[0]._id,
        paddock: "Main",
        weight: 2.62,
        weightDate: new Date("2024-11-05"),
        recordedBy: "Azeezat",
        notes: "3 days old",
        healthRecords: []
      },
      {
        tagId: "BGWM001",
        animalId: "BGWM001",
        name: "WKM",
        species: "Goat",
        breed: "Boer",
        origin: "Local",
        class: "Kid",
        gender: "Male",
        dob: new Date("2024-10-31"),
        acquisitionType: "Born",
        acquisitionDate: new Date("2024-10-31"),
        sireId: null,
        damId: null,
        status: "Alive",
        location: locations[0]._id,
        paddock: "Main",
        weight: 2.75,
        weightDate: new Date("2024-11-05"),
        recordedBy: "Azeezat",
        notes: "5 days old",
        healthRecords: []
      }
    ]);
    console.log("✓ Animals created");

    // --- SEED MEDICATIONS ---
    const medications = await Medication.insertMany([
      { name: "Jubail Penstrep", details: "100ml", expirationDate: new Date("2029-02-01"), category: "Antibiotic", purpose: "Bacterial infections", recommendedDosage: "As prescribed" },
      { name: "Jubail Albendazole bolus", details: "600mg", expirationDate: new Date("2027-12-01"), category: "Dewormer", purpose: "Internal parasites", recommendedDosage: "As prescribed" },
      { name: "Kepromec Ivermectin", details: "50ml", expirationDate: new Date("2027-12-01"), category: "Dewormer", purpose: "Internal & external parasites", recommendedDosage: "0.2-0.5ml per animal" },
      { name: "Jubail Levamisole", details: "100ml", expirationDate: new Date("2027-03-01"), category: "Dewormer", purpose: "Internal parasites", recommendedDosage: "1ml per animal" },
      { name: "Jubail Tylosine", details: "100ml", expirationDate: new Date("2027-10-01"), category: "Antibiotics", purpose: "Respiratory infections", recommendedDosage: "As prescribed" },
      { name: "Jubail Iron", details: "100ml", expirationDate: new Date("2028-01-01"), category: "Iron supplement", purpose: "Iron deficiency", recommendedDosage: "As prescribed" },
      { name: "Kepro Penstrep", details: "100ml", expirationDate: new Date("2025-06-01"), category: "Antibiotics", purpose: "Bacterial infections", recommendedDosage: "As prescribed" },
      { name: "Jubail Gentamicine", details: "100ml", expirationDate: new Date("2025-05-01"), category: "Antibiotics", purpose: "Bacterial infections", recommendedDosage: "As prescribed" },
      { name: "Jubail Oxytet 5%", details: "100ml", expirationDate: new Date("2028-02-01"), category: "Antibiotics", purpose: "Bacterial infections", recommendedDosage: "As prescribed" },
      { name: "Oxytocin", details: "10 Ampoule", expirationDate: new Date("2025-08-01"), category: "Oxytocin", purpose: "Labor induction", recommendedDosage: "As prescribed" },
      { name: "oxySpray", details: "210ml", expirationDate: new Date("2026-04-01"), category: "Antibiotics", purpose: "Wound spray", recommendedDosage: "Topical" },
      { name: "Tetranor spray", details: "250ml", expirationDate: new Date("2027-09-01"), category: "Antibiotics", purpose: "Wound spray", recommendedDosage: "Topical" },
      { name: "Pour On acaricide", details: "210ml", expirationDate: new Date("2026-04-01"), category: "Ectoparasites control", purpose: "External parasites", recommendedDosage: "5ml per animal" },
      { name: "V.BNOr Vit.Bcomplex", details: "10ml", expirationDate: new Date("2027-11-01"), category: "Multivitamin", purpose: "Vitamin B supplement", recommendedDosage: "As prescribed" },
      { name: "VMultinor", details: "100ml", expirationDate: new Date("2027-11-01"), category: "Multivitamin", purpose: "General vitamin support", recommendedDosage: "2ml per animal" },
      { name: "Oxytet 20% L.A", details: "100ml", expirationDate: new Date("2027-09-01"), category: "Antibiotics", purpose: "Bacterial infections", recommendedDosage: "As prescribed" },
      { name: "sinoxy 20%LA", details: "100ml", expirationDate: new Date("2027-03-01"), category: "Antibiotics", purpose: "Bacterial infections", recommendedDosage: "As prescribed" },
      { name: "Sulfanor", details: "100ml", expirationDate: new Date("2028-07-01"), category: "Antibiotics", purpose: "Bacterial infections", recommendedDosage: "4ml per animal" },
      { name: "Amprolium WSP", details: "4/2026", expirationDate: new Date("2026-04-01"), category: "Anticocci", purpose: "Coccidiosis treatment", recommendedDosage: "As prescribed" },
      { name: "Moosun-multivitamin", details: "150gwsp", expirationDate: new Date("2027-10-17"), category: "Immune Boosters", purpose: "Immunity support", recommendedDosage: "As prescribed" },
      { name: "Ivermectin 1%", details: "100ml", expirationDate: new Date("2026-03-01"), category: "Dewormer", purpose: "Internal parasites", recommendedDosage: "As prescribed" },
      { name: "Gadol", details: "200ml", expirationDate: new Date("2028-04-01"), category: "Ectoparasites control", purpose: "External parasites", recommendedDosage: "As prescribed" },
      { name: "Nino ethyl rubbing spirit", details: "2L", expirationDate: new Date("2027-07-01"), category: "Disinfectant", purpose: "Skin disinfection", recommendedDosage: "Topical" },
      { name: "Moko iodine", details: "15ml", expirationDate: new Date("2028-05-01"), category: "Disinfectant", purpose: "Wound disinfection", recommendedDosage: "Topical" },
      { name: "Calcium gluconate", details: "10amp", expirationDate: new Date("2027-05-01"), category: "Calcium supplement", purpose: "Calcium supplementation", recommendedDosage: "As prescribed" },
      { name: "Dexamore", details: "100ml", expirationDate: new Date("2027-01-01"), category: "Anti-inflammatory", purpose: "Inflammation reduction", recommendedDosage: "As prescribed" },
      { name: "Sulfamore", details: "100ml", expirationDate: new Date("2027-01-01"), category: "Antibiotics", purpose: "Bacterial infections", recommendedDosage: "As prescribed" },
      { name: "Diastop", details: "100ml", expirationDate: new Date("2027-05-01"), category: "Antidiarrheals", purpose: "Diarrhea treatment", recommendedDosage: "As prescribed" },
      { name: "Diclofenac Sodium Inj.", details: "10amp", expirationDate: new Date("2027-09-01"), category: "Pain reliever", purpose: "Pain management", recommendedDosage: "As prescribed" },
      { name: "Ampromore Wsp", details: "300mg", expirationDate: new Date("2025-11-01"), category: "Anticocci", purpose: "Coccidiosis treatment", recommendedDosage: "As prescribed" },
      { name: "ORS", details: "20.5g", expirationDate: new Date("2028-09-01"), category: "Rehydration salt", purpose: "Electrolyte replacement", recommendedDosage: "As prescribed" },
      { name: "Baking soda", details: "50g", expirationDate: new Date("2026-09-13"), category: "Bloat control", purpose: "Bloat prevention", recommendedDosage: "As prescribed" },
      { name: "Gentamicin Eye drops", details: "10ml", expirationDate: new Date("2025-12-01"), category: "Antibiotics", purpose: "Eye infections", recommendedDosage: "Topical" },
      { name: "Epsom salt", details: "12/2027", expirationDate: new Date("2027-12-01"), category: "Salts", purpose: "Laxative", recommendedDosage: "As prescribed" },
      { name: "Ivermax", details: "1Litre", expirationDate: new Date("2026-10-01"), category: "General Anti parasite", purpose: "Parasites", recommendedDosage: "As prescribed" },
      { name: "Duravet Colostrum Replacer", details: "14/2028", expirationDate: new Date("2028-02-14"), category: "Colostrum", purpose: "Calf immunity", recommendedDosage: "As prescribed" },
      { name: "Kyroligo", details: "100ml", expirationDate: new Date("2026-01-01"), category: "Vitamin& Mineral supplement", purpose: "Vitamin and mineral support", recommendedDosage: "As prescribed" },
      { name: "Maxitet 23%LA", details: "500ml", expirationDate: new Date("2025-12-01"), category: "Antibiotics", purpose: "Bacterial infections", recommendedDosage: "As prescribed" },
      { name: "Ivermax+ADE", details: "500ml", expirationDate: new Date("2027-02-01"), category: "Anti parasite+Vitamin", purpose: "Parasites and vitamin support", recommendedDosage: "As prescribed" },
      { name: "Maxisulf LA", details: "500ml", expirationDate: new Date("2025-09-01"), category: "Antibiotics", purpose: "Bacterial infections", recommendedDosage: "As prescribed" },
      { name: "Oximycin 230La", details: "500ml", expirationDate: new Date("2025-08-01"), category: "Antibiotics", purpose: "Bacterial infections", recommendedDosage: "As prescribed" },
      { name: "B-CO Bolic", details: "500ml", expirationDate: new Date("2025-12-01"), category: "Tonic", purpose: "Vitamin B complex", recommendedDosage: "As prescribed" },
      { name: "Cotton wool", details: "500g", expirationDate: new Date("2029-02-01"), category: "Medical supplies", purpose: "Wound care", recommendedDosage: "As needed" },
      { name: "Hydrogen peroxide", details: "200ml", expirationDate: new Date("2027-05-01"), category: "Disinfectant", purpose: "Wound cleaning", recommendedDosage: "Topical" },
      { name: "Diaoquench herbal wsp", details: "25g", expirationDate: new Date("2026-07-10"), category: "Antidiarrheals", purpose: "Diarrhea treatment", recommendedDosage: "As prescribed" },
      { name: "Electropower", details: "100g Wsp", expirationDate: new Date("2025-09-01"), category: "Electrolyte", purpose: "Electrolyte replacement", recommendedDosage: "As prescribed" },
      { name: "Vitamix", details: "100g Wsp", expirationDate: new Date("2025-12-01"), category: "Vitamin", purpose: "Vitamin supplementation", recommendedDosage: "As prescribed" },
      { name: "Electroguard NF gel", details: "5L", expirationDate: new Date("2025-07-16"), category: "Anti stress", purpose: "Stress reduction", recommendedDosage: "As prescribed" },
      { name: "Ovu-Min-Cu", details: "5L", expirationDate: new Date("2204-12-28"), category: "ANTI STRESS", purpose: "Stress and mineral support", recommendedDosage: "As prescribed" },
      { name: "Immunovite", details: "5L", expirationDate: new Date("2025-07-25"), category: "Anti stress", purpose: "Immunity support", recommendedDosage: "As prescribed" },
      { name: "Prodose Orange", details: "5L", expirationDate: new Date("2027-01-01"), category: "Dewormer", purpose: "Internal parasites", recommendedDosage: "As prescribed" },
      { name: "Panacur Bs", details: "5L", expirationDate: new Date("2025-10-01"), category: "Dewormer", purpose: "Internal parasites", recommendedDosage: "As prescribed" },
      { name: "Eradiworm", details: "5L", expirationDate: new Date("2027-03-01"), category: "Dewormer", purpose: "Internal parasites", recommendedDosage: "As prescribed" }
    ]);
    console.log("✓ Medications created");

    // --- SEED INVENTORY ---
    const inventory = await Inventory.insertMany([
      { 
        name: "Oxytet 20%", 
        quantity: 1, 
        category: "Medication", 
        minStock: 0,
        price: 5000,
        unit: "L",
        dateAdded: new Date("2024-10-14"),
        notes: "In stock"
      },
      { 
        name: "Multivitamin", 
        quantity: 1, 
        category: "Medication", 
        minStock: 0,
        price: 3000,
        unit: "100ml",
        dateAdded: new Date("2024-10-14"),
        notes: "In stock"
      },
      { 
        name: "Feed (Pelleted)", 
        quantity: 500, 
        category: "Feed", 
        minStock: 100,
        price: 2500,
        unit: "kg",
        dateAdded: new Date("2024-10-01"),
        notes: "Main animal feed"
      },
      { 
        name: "Hay", 
        quantity: 200, 
        category: "Feed", 
        minStock: 50,
        price: 1500,
        unit: "bales",
        dateAdded: new Date("2024-10-05"),
        notes: "Quality hay for nutrition"
      },
      { 
        name: "Water Troughs", 
        quantity: 5, 
        category: "Equipment", 
        minStock: 2,
        price: 15000,
        unit: "units",
        dateAdded: new Date("2024-09-01"),
        notes: "Farm equipment"
      },
      { 
        name: "Feeding Buckets", 
        quantity: 10, 
        category: "Equipment", 
        minStock: 3,
        price: 5000,
        unit: "units",
        dateAdded: new Date("2024-09-01"),
        notes: "Farm equipment"
      },
      { 
        name: "Veterinary Gloves", 
        quantity: 500, 
        category: "Supplies", 
        minStock: 100,
        price: 500,
        unit: "pairs",
        dateAdded: new Date("2024-09-15"),
        notes: "Medical supplies"
      },
      { 
        name: "Syringes", 
        quantity: 100, 
        category: "Supplies", 
        minStock: 20,
        price: 2000,
        unit: "boxes",
        dateAdded: new Date("2024-09-15"),
        notes: "Medical supplies"
      }
    ]);
    console.log("✓ Inventory created");

    // --- SEED FINANCE (EXPENSES) ---
    const finance = await Finance.insertMany([
      { 
        date: new Date("2025-08-31"), 
        month: "August",
        title: "Feed Transfer to Annex Farm",
        description: "Bulk feed transfer for livestock care",
        category: "Feed",
        type: "expense",
        amount: 5000, 
        paymentMethod: "Bank Transfer",
        vendor: "Premium Feed Suppliers",
        invoiceNumber: "INV-2025-001",
        status: "Completed",
        recordedBy: "Azeezat",
        notes: "Feed purchase for goats"
      },
      { 
        date: new Date("2025-08-31"), 
        month: "August",
        title: "Fuel for Farm Operations",
        description: "Diesel purchase for farm vehicles and generators",
        category: "Transport",
        type: "expense",
        amount: 12500, 
        paymentMethod: "Cash",
        vendor: "ABC Fuel Station",
        invoiceNumber: "FS-8765",
        status: "Completed",
        recordedBy: "Azeezat",
        notes: "Fuel expense for Wisdom vehicle"
      },
      { 
        date: new Date("2025-09-02"), 
        month: "September",
        title: "Monthly Internet Subscription",
        description: "Farm management software and communication",
        category: "Admin",
        type: "expense",
        amount: 5000, 
        paymentMethod: "Bank Transfer",
        vendor: "Internet Service Provider",
        invoiceNumber: "ISP-2025-09",
        status: "Completed",
        recordedBy: "Admin",
        notes: "Administrative cost"
      },
      { 
        date: new Date("2025-09-02"), 
        month: "September",
        title: "Gas Refill - Annex Farm",
        description: "Cooking gas for farm kitchen and facilities",
        category: "Utilities",
        type: "expense",
        amount: 3900, 
        paymentMethod: "Cash",
        vendor: "Local Gas Distributor",
        invoiceNumber: "GAS-09-2025",
        status: "Completed",
        recordedBy: "Azeezat",
        notes: "Gas purchase for annex farm"
      },
      { 
        date: new Date("2025-09-04"), 
        month: "September",
        title: "Raised Pen Installation",
        description: "Construction and assembly of 3 raised pens",
        category: "Equipment",
        type: "expense",
        amount: 25000, 
        paymentMethod: "Bank Transfer",
        vendor: "Farm Equipment Builders",
        invoiceNumber: "PEN-3-2025",
        status: "Completed",
        recordedBy: "Azeezat",
        notes: "Equipment maintenance and installation"
      },
      { 
        date: new Date("2025-09-10"), 
        month: "September",
        title: "Veterinary Medication Stock",
        description: "Purchase of antibiotics and vitamins for livestock",
        category: "Medication",
        type: "expense",
        amount: 18500, 
        paymentMethod: "Bank Transfer",
        vendor: "Veterinary Supplies Ltd",
        invoiceNumber: "VET-MED-2025",
        status: "Completed",
        recordedBy: "Azeezat",
        notes: "Medication stock replenishment"
      },
      { 
        date: new Date("2025-09-15"), 
        month: "September",
        title: "Farm Maintenance Work",
        description: "Repair of fencing, water systems and structures",
        category: "Maintenance",
        type: "expense",
        amount: 8700, 
        paymentMethod: "Cash",
        vendor: "Farm Maintenance Team",
        invoiceNumber: "MAIN-15-2025",
        status: "Completed",
        recordedBy: "Azeezat",
        notes: "General farm repairs and maintenance"
      },
      { 
        date: new Date("2025-09-20"), 
        month: "September",
        title: "Staff Wages - September",
        description: "Monthly salaries for 2 farm workers",
        category: "Labor",
        type: "expense",
        amount: 40000, 
        paymentMethod: "Bank Transfer",
        vendor: "Farm Payroll",
        invoiceNumber: "PAY-SEP-2025",
        status: "Completed",
        recordedBy: "Admin",
        notes: "Monthly labor costs"
      },
      { 
        date: new Date("2025-09-22"), 
        month: "September",
        title: "Petty Cash - Miscellaneous",
        description: "Small operational expenses and supplies",
        category: "Petty Cash",
        type: "expense",
        amount: 2300, 
        paymentMethod: "Cash",
        vendor: "Various Vendors",
        invoiceNumber: "PETTY-22-2025",
        status: "Completed",
        recordedBy: "Azeezat",
        notes: "Miscellaneous farm supplies"
      },
      { 
        date: new Date("2025-09-25"), 
        month: "September",
        title: "Water Tank Cleaning & Maintenance",
        description: "Professional cleaning and sanitization of water tanks",
        category: "Maintenance",
        type: "expense",
        amount: 3500, 
        paymentMethod: "Cash",
        vendor: "Water Services",
        invoiceNumber: "WATER-25-2025",
        status: "Completed",
        recordedBy: "Azeezat",
        notes: "Water system maintenance"
      }
    ]);
    console.log("✓ Expense records created");

    console.log("\n✅ DATABASE SUCCESSFULLY SEEDED!");
    console.log("\n📊 Summary:");
    console.log(`  - Locations: ${locations.length}`);
    console.log(`  - Users: ${users.length}`);
    console.log(`  - Animals: ${animals.length}`);
    console.log(`  - Medications: ${medications.length}`);
    console.log(`  - Inventory Items: ${inventory.length}`);
    console.log(`  - Finance Records: ${finance.length}`);
    console.log("\n🔐 Demo Credentials:");
    console.log("  SuperAdmin: admin@farm.com / admin123");
    console.log("  Manager: manager@farm.com / manager123");
    console.log("  Attendant: attendant@farm.com / attendant123");

    process.exit(0);
  } catch (err) {
    console.error("❌ Error seeding database:", err);
    process.exit(1);
  }
}

seed();
