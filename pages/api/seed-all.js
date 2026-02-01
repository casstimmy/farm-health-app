import dbConnect from "@/lib/mongodb";
import Animal from "@/models/Animal";
import Treatment from "@/models/Treatment";
import { getTokenFromRequest, verifyToken } from "@/utils/auth";

// Sample animal data
const sampleAnimals = [
  { tagId: "SGF001", breed: "Sahel", gender: "Female" },
  { tagId: "BGF001", breed: "Boar", gender: "Female" },
  { tagId: "BGF002", breed: "Boar", gender: "Female" }
];

// Sample treatment data (animalTag links to tagId above)
const sampleTreatments = [
  {
    date: "2024-10-12",
    animalTag: "SGF001",
    routine: "NO",
    symptoms: "Emaciation",
    possibleCause: "",
    diagnosis: "",
    prescribedDays: "3days",
    type: "Vitamin Dosing",
    preWeight: "100ml VMultinor",
    medication: "VMultinor",
    dosage: "2ml",
    route: "IM",
    treatedBy: "Azeezat",
    postObservation: "",
    observationTime: "",
    completionDate: "2024-10-14",
    recoveryStatus: "",
    postWeight: "",
    notes: ""
  },
  {
    date: "2024-10-13",
    animalTag: "SGF001",
    routine: "NO",
    symptoms: "watery feaces",
    possibleCause: "",
    diagnosis: "Diarrhea",
    prescribedDays: "3days",
    type: "Antibiotics",
    preWeight: "100ml Sulfanor",
    medication: "Sulfanor",
    dosage: "4ml",
    route: "IM",
    treatedBy: "Azeezat",
    postObservation: "",
    observationTime: "",
    completionDate: "2024-10-17",
    recoveryStatus: "",
    postWeight: "",
    notes: ""
  },
  {
    date: "2024-10-18",
    animalTag: "SGF001",
    routine: "NO",
    symptoms: "Watery feaces",
    possibleCause: "worms",
    diagnosis: "Diarrhea",
    prescribedDays: "3days Interval",
    type: "Deworming",
    preWeight: "Kepromec Ivermectin 50ml",
    medication: "Kepromec Ivermectin",
    dosage: "0.5ml",
    route: "Subcutaneous",
    treatedBy: "Azeezat",
    postObservation: "",
    observationTime: "",
    completionDate: "2024-10-21",
    recoveryStatus: "",
    postWeight: "",
    notes: ""
  },
  {
    date: "2024-10-23",
    animalTag: "BGF001",
    routine: "NO",
    symptoms: "Body scratching against wall",
    possibleCause: "Lice",
    diagnosis: "External parasite",
    prescribedDays: "",
    type: "Ext- Parasite",
    preWeight: "Pour On acaricide 210ml",
    medication: "Pour On acaricide",
    dosage: "5ml /Backline",
    route: "",
    treatedBy: "Azeezat",
    postObservation: "",
    observationTime: "",
    completionDate: "",
    recoveryStatus: "",
    postWeight: "",
    notes: ""
  },
  {
    date: "2024-10-23",
    animalTag: "BGF002",
    routine: "NO",
    symptoms: "Body Scratching against wall",
    possibleCause: "Lice",
    diagnosis: "External Parasite",
    prescribedDays: "",
    type: "Ext- Parasite",
    preWeight: "Pour On acaricide 210ml",
    medication: "Pour On acaricide",
    dosage: "5ml /Backline",
    route: "",
    treatedBy: "Azeezat",
    postObservation: "",
    observationTime: "",
    completionDate: "",
    recoveryStatus: "",
    postWeight: "",
    notes: ""
  },
  {
    date: "2024-10-27",
    animalTag: "SGF001",
    routine: "NO",
    symptoms: "Watery feaces",
    possibleCause: "Worm",
    diagnosis: "Diarrhea",
    prescribedDays: "a week interval",
    type: "Ext- Parasite",
    preWeight: "Jubail Levamisole 100ml",
    medication: "Jubail Levamisole",
    dosage: "1ml",
    route: "Subcutaneous",
    treatedBy: "Azeezat",
    postObservation: "",
    observationTime: "",
    completionDate: "",
    recoveryStatus: "",
    postWeight: "",
    notes: ""
  }
];

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  try {
    const token = getTokenFromRequest(req);
    if (!token || !verifyToken(token)) return res.status(401).json({ error: "Unauthorized" });
    await dbConnect();
    // Seed animals
    await Animal.deleteMany({});
    const createdAnimals = await Animal.insertMany(sampleAnimals);
    // Map tagId to ObjectId
    const animalMap = {};
    createdAnimals.forEach(a => { animalMap[a.tagId] = a._id; });
    // Seed treatments with correct animal reference
    const docs = sampleTreatments.map(t => ({
      ...t,
      animal: animalMap[t.animalTag],
      date: t.date ? new Date(t.date) : undefined,
      completionDate: t.completionDate ? new Date(t.completionDate) : undefined,
    }));
    docs.forEach(d => { delete d.animalTag; });
    await Treatment.deleteMany({});
    await Treatment.insertMany(docs);
    return res.status(200).json({ message: "Animals and treatments seeded successfully" });
  } catch (err) {
    return res.status(500).json({ error: "Failed to seed animals/treatments", details: err.message });
  }
}
