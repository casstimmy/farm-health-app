import dbConnect from "@/lib/mongodb";
import FeedType from "@/models/FeedType";
import { withAuth } from "@/utils/middleware";
import mongoose from "mongoose";

async function handler(req, res) {
  await dbConnect();
  const { id } = req.query;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid ID format" });
  }

  if (req.method === "PUT") {
    try {
      if (!["SuperAdmin", "Manager"].includes(req.user?.role)) {
        return res
          .status(403)
          .json({ error: "Forbidden: Insufficient permissions" });
      }

      const updated = await FeedType.findByIdAndUpdate(id, req.body, {
        new: true,
        runValidators: true,
      });
      if (!updated) {
        return res.status(404).json({ error: "Feed type not found" });
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

      const deleted = await FeedType.findByIdAndDelete(id);
      if (!deleted) {
        return res.status(404).json({ error: "Feed type not found" });
      }
      res.status(200).json({ message: "Feed type deleted" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}

export default withAuth(handler);
