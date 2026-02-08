import dbConnect from "@/lib/mongodb";
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

      const weight = {
        date: weightData.date || new Date(),
        weightKg: weightData.weightKg,
        recordedBy: weightData.recordedBy || req.user.name,
        notes: weightData.notes || ""
      };

      animal.weightHistory.push(weight);
      await animal.save();

      res.status(201).json({ message: "Weight record added", weight });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === "GET") {
    try {
      const { animalId } = req.query;

      if (!animalId) {
        return res.status(400).json({ error: "animalId required" });
      }

      const animal = await Animal.findById(animalId);
      if (!animal) {
        return res.status(404).json({ error: "Animal not found" });
      }

      res.status(200).json(animal.weightHistory);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}

export default withAuth(handler);
