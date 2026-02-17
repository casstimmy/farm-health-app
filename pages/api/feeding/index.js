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

      // Support both new (feedItems array) and old (single item) formats
      let feedItems = [];
      let totalQuantityOffered = 0;
      let totalQuantityConsumed = 0;
      let totalFeedCost = 0;

      if (feedingData.feedItems && Array.isArray(feedingData.feedItems)) {
        // New format with multiple items
        feedItems = feedingData.feedItems.filter(fi => fi.feedTypeName?.trim());
        totalQuantityOffered = feedItems.reduce((sum, fi) => sum + (fi.quantityOffered || 0), 0);
        totalQuantityConsumed = feedItems.reduce((sum, fi) => sum + (fi.quantityConsumed || 0), 0);
        totalFeedCost = feedItems.reduce((sum, fi) => sum + (fi.totalCost || 0), 0);
      } else {
        // Old format for backward compatibility - convert to single item in array
        if (feedingData.feedCategory || feedingData.feedTypeName) {
          feedItems = [{
            feedTypeName: feedingData.feedCategory || feedingData.feedTypeName || "",
            inventoryItem: feedingData.inventoryItem || undefined,
            quantityOffered: feedingData.quantityOffered || 0,
            quantityConsumed: feedingData.quantityConsumed || 0,
            unitCost: feedingData.unitCost || 0,
            totalCost: feedingData.totalCost || 0,
          }];
          totalQuantityOffered = feedItems[0].quantityOffered;
          totalQuantityConsumed = feedItems[0].quantityConsumed;
          totalFeedCost = feedItems[0].totalCost;
        }
      }

      if (feedItems.length === 0) {
        return res.status(400).json({ error: "At least one feed item is required" });
      }

      const record = await FeedingRecord.create({
        animal: animalId,
        feedItems,
        date: feedingData.date || new Date(),
        feedingMethod: feedingData.feedingMethod || "",
        location: feedingData.location || animal.location || null,
        notes: feedingData.notes || "",
        totalQuantityOffered,
        totalQuantityConsumed,
        totalFeedCost,
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
          .populate("feedItems.inventoryItem")
          .lean();
        return res.status(200).json(records);
      }

      // Return all feeding records if no animalId
      const records = await FeedingRecord.find()
        .sort({ date: -1 })
        .populate("animal")
        .populate("feedItems.inventoryItem")
        .populate("location")
        .lean();
      res.status(200).json(records);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}

export default withAuth(handler);
