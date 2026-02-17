import dbConnect from "@/lib/mongodb";
import HealthRecord from "@/models/HealthRecord";
import { withAuth } from "@/utils/middleware";

async function handler(req, res) {
  await dbConnect();
  const { id } = req.query;

  if (req.method === "GET") {
    try {
      const record = await HealthRecord.findById(id)
        .populate("animal", "tagId name species breed gender currentWeight")
        .populate("treatmentA.medication", "item unit price")
        .populate("treatmentB.medication", "item unit price")
        .lean();

      if (!record) return res.status(404).json({ error: "Record not found" });
      res.status(200).json(record);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === "PUT") {
    try {
      const record = await HealthRecord.findByIdAndUpdate(id, req.body, {
        new: true,
        runValidators: true,
      })
        .populate("animal", "tagId name species breed gender currentWeight")
        .populate("treatmentA.medication", "item unit price")
        .populate("treatmentB.medication", "item unit price");

      if (!record) return res.status(404).json({ error: "Record not found" });
      res.status(200).json(record);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === "DELETE") {
    try {
      if (req.user?.role !== "SuperAdmin") {
        return res.status(403).json({ error: "Only SuperAdmin can delete health records" });
      }
      const record = await HealthRecord.findByIdAndDelete(id);
      if (!record) return res.status(404).json({ error: "Record not found" });
      res.status(200).json({ message: "Record deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}

export default withAuth(handler);
