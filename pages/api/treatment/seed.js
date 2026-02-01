import dbConnect from "@/lib/mongodb";
import Treatment from "@/models/Treatment";
import Animal from "@/models/Animal";
import { getTokenFromRequest, verifyToken } from "@/utils/auth";


// Sample data with animal tagId
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
    // Find all animals by tagId and map to ObjectId
    const animals = await Animal.find({ tagId: { $in: sampleTreatments.map(t => t.animalTag) } });
    const animalMap = {};
    animals.forEach(a => { animalMap[a.tagId] = a._id; });
    // Prepare treatments with animal ObjectId
    const docs = sampleTreatments.map(t => ({
      ...t,
      animal: animalMap[t.animalTag] || null,
      date: t.date ? new Date(t.date) : undefined,
      completionDate: t.completionDate ? new Date(t.completionDate) : undefined,
    }));
    // Remove animalTag from docs
    docs.forEach(d => { delete d.animalTag; });
    await Treatment.insertMany(docs);
    return res.status(200).json({ message: "Sample treatments seeded (animal may be null)" });
  } catch (err) {
    return res.status(500).json({ error: "Failed to seed treatments" });
  }
}
