import dbConnect from "@/lib/mongodb";
import FeedingRecord from "@/models/FeedingRecord";
import Animal from "@/models/Animal";
import "@/models/Inventory";
import "@/models/Location";
import { withAuth } from "@/utils/middleware";

// Feed conversion efficiency: % of consumed feed converted to body weight
// Using mid-range values for each species
const FEED_CONVERSION_RATES = {
  goat: 0.195,       // 17-22% → ~19.5%
  sheep: 0.215,      // 18-25% → ~21.5%
  cow: 0.13,         // 10-16% → ~13%
  cattle: 0.13,
  chicken: 0.60,     // 55-65% → ~60%
  poultry: 0.60,
  turkey: 0.38,      // 30-45% → ~37.5%
  pig: 0.35,         // 28-40% → ~34%
  swine: 0.35,
  rabbit: 0.25,      // 20-30% → ~25%
  fish: 0.55,        // 40-70% → ~55%
  duck: 0.40,        // 30-50% → ~40%
  horse: 0.08,       // 5-10% → ~7.5%
  donkey: 0.08,
  camel: 0.10,       // 8-12% → ~10%
};

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

      // Update animal's projected weight based on feed consumed and species conversion rate
      if (totalQuantityConsumed > 0) {
        const species = (animal.species || "").toLowerCase().trim();
        const conversionRate = FEED_CONVERSION_RATES[species] || 0.15; // default 15%
        const weightGain = +(totalQuantityConsumed * conversionRate).toFixed(2);
        const currentWeight = animal.currentWeight || 0;
        const newProjectedWeight = +(currentWeight + weightGain).toFixed(2);

        await Animal.findByIdAndUpdate(animalId, {
          $inc: { totalFeedCost: totalFeedCost },
          projectedMaxWeight: newProjectedWeight,
        });
      } else {
        // Still track feed cost even with 0 consumed
        if (totalFeedCost > 0) {
          await Animal.findByIdAndUpdate(animalId, {
            $inc: { totalFeedCost: totalFeedCost },
          });
        }
      }

      res.status(201).json({ message: "Feeding record added", feeding: record });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === "GET") {
    try {
      const { animalId, compact } = req.query;
      const isCompact = compact === "true" || compact === "1";

      if (animalId) {
        const records = await FeedingRecord.find({ animal: animalId })
          .sort({ date: -1 })
          .populate("feedItems.inventoryItem", "item unit")
          .lean();
        return res.status(200).json(records);
      }

      // Return all feeding records if no animalId
      let query = FeedingRecord.find().sort({ date: -1 });
      if (isCompact) {
        query = query
          .select({
            animal: 1,
            date: 1,
            totalFeedCost: 1,
            totalQuantityOffered: 1,
            totalQuantityConsumed: 1,
            feedingMethod: 1,
            location: 1,
          })
          .populate("animal", "tagId name")
          .populate("location", "name");
      } else {
        query = query
          .populate("animal")
          .populate("feedItems.inventoryItem")
          .populate("location");
      }

      const records = await query.lean();
      res.status(200).json(records);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}

export default withAuth(handler);
