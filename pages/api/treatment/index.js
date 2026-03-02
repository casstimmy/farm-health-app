import dbConnect from "@/lib/mongodb";
import Treatment from "@/models/Treatment";
import HealthRecord from "@/models/HealthRecord";
import Animal from "@/models/Animal";
import "@/models/Inventory";
import { withAuth } from "@/utils/middleware";

function isObjectIdString(value) {
  return typeof value === "string" && /^[0-9a-fA-F]{24}$/.test(value);
}

function normalizePayload(payload) {
  const data = { ...payload };

  if (!data.animal && data.animalId) {
    data.animal = data.animalId;
  }
  delete data.animalId;

  if (data.medication && !isObjectIdString(data.medication)) {
    data.medicationName = data.medicationName || data.medication;
    data.medication = undefined;
  }

  if (data.type && !data.notes) {
    data.notes = `Type: ${data.type}`;
  }

  return data;
}

async function handler(req, res) {
  await dbConnect();

  if (req.method === "POST") {
    try {
      const normalized = normalizePayload(req.body || {});
      const { animal, ...treatmentData } = normalized;
      if (!animal) {
        return res.status(400).json({ error: "animal (ObjectId) required" });
      }
      // Default recoveryStatus to "Under Treatment" if not provided
      if (!treatmentData.recoveryStatus) {
        treatmentData.recoveryStatus = "Under Treatment";
      }
      const treatment = await Treatment.create({ ...treatmentData, animal });

      // Auto-create a linked HealthRecord
      try {
        const animalDoc = await Animal.findById(animal);
        const healthRecordData = {
          animal,
          date: treatment.date,
          animalTagId: animalDoc?.tagId || "",
          animalGender: animalDoc?.gender || "",
          animalBreed: animalDoc?.breed || "",
          isRoutine: treatment.routine === "YES",
          symptoms: treatment.symptoms || "",
          possibleCause: treatment.possibleCause || "",
          diagnosis: treatment.diagnosis || "",
          prescribedDays: treatment.prescribedDays || 0,
          preWeight: treatment.preWeight,
          treatmentA: {
            treatmentType: treatment.type || "",
            medication: treatment.medication || null,
            medicationName: treatment.medicationName || "",
            dosage: treatment.dosage || "",
            route: treatment.route || "",
          },
          treatedBy: treatment.treatedBy || "",
          postObservation: treatment.postObservation || "",
          observationTime: treatment.observationTime || "",
          completionDate: treatment.completionDate || null,
          recoveryStatus: treatment.recoveryStatus || "Under Treatment",
          postWeight: treatment.postWeight,
          notes: treatment.notes || "",
          linkedTreatment: treatment._id,
        };
        await HealthRecord.create(healthRecordData);
      } catch (hrErr) {
        console.warn("Auto-create health record failed:", hrErr.message);
      }

      res.status(201).json({ message: "Treatment record added", treatment });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === "GET") {
    try {
      // Return all treatments, populated with animal details
      const treatments = await Treatment.find()
        .sort({ date: -1, createdAt: -1 })
        .populate("animal", "tagId name species breed gender")
        .lean();
      res.status(200).json(treatments);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}

export default withAuth(handler);
