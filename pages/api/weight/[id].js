import dbConnect from "@/lib/mongodb";
import WeightRecord from "@/models/WeightRecord";
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
      const record = await WeightRecord.findById(id)
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
      const updated = await WeightRecord.findByIdAndUpdate(
        id,
        {
          weightKg: data.weightKg ?? undefined,
          date: data.date || undefined,
          recordedBy: data.recordedBy ?? undefined,
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
      const deleted = await WeightRecord.findByIdAndDelete(id);
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
