import dbConnect from "@/lib/mongodb";
import Animal from "@/models/Animal";
import { withAuth } from "@/utils/middleware";

async function handler(req, res) {
  await dbConnect();

  if (req.method === "POST") {
    try {
      const { animalId, feedingData } = req.body;

      if (!animalId || !feedingData) {
        return res.status(400).json({ error: "animalId and feedingData required" });
      }

      const animal = await Animal.findById(animalId);
      if (!animal) {
        return res.status(404).json({ error: "Animal not found" });
      }

      const feeding = {
        date: feedingData.date || new Date(),
        feedCategory: feedingData.feedCategory,
        quantityOffered: feedingData.quantityOffered,
        quantityConsumed: feedingData.quantityConsumed,
        feedingMethod: feedingData.feedingMethod,
        notes: feedingData.notes
      };

      animal.feedingHistory.push(feeding);
      await animal.save();

      res.status(201).json({ message: "Feeding record added", feeding });
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

      res.status(200).json(animal.feedingHistory);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}

export default withAuth(handler);
