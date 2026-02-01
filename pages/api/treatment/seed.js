import dbConnect from "@/lib/mongodb";
import Treatment from "@/models/Treatment";
import { getTokenFromRequest, verifyToken } from "@/utils/auth";

// Sample data from user
const sampleTreatments = [
  {
    date: "2024-10-12",
    animalId: "SGF001",
    breed: "Sahel",
    gender: "Female",
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
    animalId: "SGF001",
    breed: "Sahel",
    gender: "Female",
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
    animalId: "SGF001",
    breed: "Sahel",
    gender: "Female",
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
    animalId: "BGF001",
    breed: "Boar",
    gender: "Female",
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
    animalId: "BGF002",
    breed: "Boar",
    gender: "Female",
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
    animalId: "SGF001",
    breed: "Sahel",
    gender: "Female",
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
    await Treatment.insertMany(sampleTreatments);
    return res.status(200).json({ message: "Sample treatments seeded" });
  } catch (err) {
    return res.status(500).json({ error: "Failed to seed treatments" });
  }
}
