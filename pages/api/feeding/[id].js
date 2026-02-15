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
        .populate("location");
      if (!record) return res.status(404).json({ error: "Record not found" });
      res.status(200).json(record);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === "PUT") {
    try {
      const data = req.body;
      const updated = await FeedingRecord.findByIdAndUpdate(
        id,
        {
          feedTypeName: data.feedTypeName ?? undefined,
          inventoryItem: data.inventoryItem || undefined,
          quantityOffered: data.quantityOffered ?? undefined,
          quantityConsumed: data.quantityConsumed ?? undefined,
          unitCost: data.unitCost ?? undefined,
          totalCost: data.totalCost ?? undefined,
          date: data.date || undefined,
          feedingMethod: data.feedingMethod ?? undefined,
          location: data.location || undefined,
          notes: data.notes ?? undefined,
        },
        { new: true, runValidators: true }
      );
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
