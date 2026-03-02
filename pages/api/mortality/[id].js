import dbConnect from "@/lib/mongodb";
import MortalityRecord from "@/models/MortalityRecord";
import Animal from "@/models/Animal";
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
      const record = await MortalityRecord.findById(id).populate(
        "animal",
        "tagId name species breed gender"
      ).lean();
      if (!record) {
        return res.status(404).json({ error: "Mortality record not found" });
      }
      res.status(200).json(record);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === "PUT") {
    try {
      if (!["SuperAdmin", "Manager"].includes(req.user?.role)) {
        return res
          .status(403)
          .json({ error: "Forbidden: Insufficient permissions" });
      }

      const updated = await MortalityRecord.findByIdAndUpdate(id, req.body, {
        new: true,
        runValidators: true,
      });
      if (!updated) {
        return res.status(404).json({ error: "Mortality record not found" });
      }
      res.status(200).json(updated);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === "DELETE") {
    try {
      if (req.user?.role !== "SuperAdmin") {
        return res
          .status(403)
          .json({ error: "Forbidden: Only SuperAdmin can delete" });
      }

      // Find the mortality record first
      const record = await MortalityRecord.findById(id);
      if (!record) {
        return res.status(404).json({ error: "Mortality record not found" });
      }

      // Archive the animal instead of leaving it as "Dead"
      if (record.animal) {
        await Animal.findByIdAndUpdate(record.animal, {
          isArchived: true,
          archivedAt: new Date(),
          archivedReason: `Mortality - ${record.cause || "Unknown cause"}`,
          status: "Dead",
        });
      }

      // Delete the mortality record
      await MortalityRecord.findByIdAndDelete(id);

      res.status(200).json({ message: "Mortality record deleted. Animal moved to Archived Animals." });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}

export default withAuth(handler);
