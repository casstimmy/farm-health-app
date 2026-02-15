import dbConnect from "@/lib/mongodb";
import WeightRecord from "@/models/WeightRecord";
import Animal from "@/models/Animal";
import { withAuth } from "@/utils/middleware";

async function handler(req, res) {
  await dbConnect();

  if (req.method === "POST") {
    try {
      const { animalId, weightData } = req.body;

      if (!animalId || !weightData) {
        return res.status(400).json({ error: "animalId and weightData required" });
      }

      const animal = await Animal.findById(animalId);
      if (!animal) {
        return res.status(404).json({ error: "Animal not found" });
      }

      // Create weight record (post-save hook auto-updates Animal.currentWeight)
      const record = await WeightRecord.create({
        animal: animalId,
        weightKg: weightData.weightKg,
        recordedBy: weightData.recordedBy || req.user?.name || "",
        date: weightData.date || new Date(),
        location: weightData.location || null,
        notes: weightData.notes || "",
      });

      res.status(201).json({ message: "Weight record added", weight: record });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === "GET") {
    try {
      const { animalId } = req.query;

      if (animalId) {
        const records = await WeightRecord.find({ animal: animalId }).sort({
          date: -1,
        });
        return res.status(200).json(records);
      }

      // Return all weight records if no animalId
      const records = await WeightRecord.find()
        .sort({ date: -1 })
        .populate("animal")
        .populate("location");
      res.status(200).json(records);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}

export default withAuth(handler);
