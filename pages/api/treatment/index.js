import dbConnect from "@/lib/mongodb";
import Treatment from "@/models/Treatment";
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
      const treatment = await Treatment.create({ ...treatmentData, animal });
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
