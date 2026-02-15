import dbConnect from "@/lib/mongodb";
import FeedingRecord from "@/models/FeedingRecord";
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

      const record = await FeedingRecord.create({
        animal: animalId,
        feedType: feedingData.feedType || undefined,
        feedTypeName: feedingData.feedCategory || feedingData.feedTypeName || "",
        inventoryItem: feedingData.inventoryItem || undefined,
        quantityOffered: feedingData.quantityOffered || 0,
        quantityConsumed: feedingData.quantityConsumed || 0,
        unitCost: feedingData.unitCost || 0,
        totalCost: feedingData.totalCost || 0,
        date: feedingData.date || new Date(),
        feedingMethod: feedingData.feedingMethod || "",
        notes: feedingData.notes || "",
      });

      res.status(201).json({ message: "Feeding record added", feeding: record });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === "GET") {
    try {
      const { animalId } = req.query;

      if (animalId) {
        const records = await FeedingRecord.find({ animal: animalId })
          .sort({ date: -1 })
          .populate("feedType");
        return res.status(200).json(records);
      }

      // Return all feeding records if no animalId
      const records = await FeedingRecord.find()
        .sort({ date: -1 })
        .populate("animal")
        .populate("feedType");
      res.status(200).json(records);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}

export default withAuth(handler);
