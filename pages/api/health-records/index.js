import dbConnect from "@/lib/mongodb";
import HealthRecord from "@/models/HealthRecord";
import Animal from "@/models/Animal";
import "@/models/Inventory";
import { withAuth } from "@/utils/middleware";

async function handler(req, res) {
  await dbConnect();

  if (req.method === "GET") {
    try {
      const { animal, recoveryStatus } = req.query;
      const filter = {};
      if (animal) filter.animal = animal;
      if (recoveryStatus && recoveryStatus !== "all") filter.recoveryStatus = recoveryStatus;

      const records = await HealthRecord.find(filter)
        .populate("animal", "tagId name species breed gender currentWeight")
        .populate("treatmentA.medication", "item unit price")
        .populate("treatmentB.medication", "item unit price")
        .sort({ date: -1 })
        .lean();

      res.status(200).json(records);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === "POST") {
    try {
      const data = req.body;

      // Validate required fields
      if (!data.animal || !data.date) {
        return res.status(400).json({ error: "Animal and date are required" });
      }

      // Auto-populate animal info
      const animal = await Animal.findById(data.animal);
      if (animal) {
        data.animalTagId = animal.tagId;
        data.animalGender = animal.gender;
        data.animalBreed = animal.breed;
      }

      const record = await HealthRecord.create(data);
      const populated = await HealthRecord.findById(record._id)
        .populate("animal", "tagId name species breed gender currentWeight")
        .populate("treatmentA.medication", "item unit price")
        .populate("treatmentB.medication", "item unit price")
        .lean();

      res.status(201).json(populated);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}

export default withAuth(handler);
