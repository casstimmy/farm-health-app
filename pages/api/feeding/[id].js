import dbConnect from "@/lib/mongodb";
import FeedingRecord from "@/models/FeedingRecord";
import { withAuth } from "@/utils/middleware";
import mongoose from "mongoose";

async function handler(req, res) {
  await dbConnect();
  const { id } = req.query;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid ID format" });
  }

  if (req.method === "GET") {
    try {
      const record = await FeedingRecord.findById(id)
        .populate("animal")
        .populate("location")
        .lean();
      if (!record) return res.status(404).json({ error: "Record not found" });
      res.status(200).json(record);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === "PUT") {
    try {
      const data = req.body;
      
      // Calculate totals
      let totalQuantityOffered = 0;
      let totalQuantityConsumed = 0;
      let totalFeedCost = 0;
      
      let feedItems = [];
      if (data.feedItems && Array.isArray(data.feedItems)) {
        feedItems = data.feedItems;
        totalQuantityOffered = feedItems.reduce((sum, fi) => sum + (fi.quantityOffered || 0), 0);
        totalQuantityConsumed = feedItems.reduce((sum, fi) => sum + (fi.quantityConsumed || 0), 0);
        totalFeedCost = feedItems.reduce((sum, fi) => sum + (fi.totalCost || 0), 0);
      } else {
        // Old format support
        feedItems = [{
          feedTypeName: data.feedTypeName || "",
          inventoryItem: data.inventoryItem || undefined,
          quantityOffered: data.quantityOffered || 0,
          quantityConsumed: data.quantityConsumed || 0,
          unitCost: data.unitCost || 0,
          totalCost: data.totalCost || 0,
        }];
        totalQuantityOffered = feedItems[0].quantityOffered;
        totalQuantityConsumed = feedItems[0].quantityConsumed;
        totalFeedCost = feedItems[0].totalCost;
      }
      
      const updated = await FeedingRecord.findByIdAndUpdate(
        id,
        {
          feedItems,
          date: data.date || undefined,
          feedingMethod: data.feedingMethod || undefined,
          location: data.location || undefined,
          notes: data.notes ?? undefined,
          totalQuantityOffered,
          totalQuantityConsumed,
          totalFeedCost,
        },
        { new: true, runValidators: true }
      ).populate("feedItems.inventoryItem").populate("animal").populate("location");
      if (!updated) return res.status(404).json({ error: "Record not found" });
      res.status(200).json(updated);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === "DELETE") {
    try {
      const deleted = await FeedingRecord.findByIdAndDelete(id);
      if (!deleted) return res.status(404).json({ error: "Record not found" });
      res.status(200).json({ message: "Record deleted" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}

export default withAuth(handler);
