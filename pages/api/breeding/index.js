import dbConnect from "@/lib/mongodb";
import BreedingRecord from "@/models/BreedingRecord";
import { withAuth } from "@/utils/middleware";

async function handler(req, res) {
  await dbConnect();

  if (req.method === "GET") {
    try {
      const records = await BreedingRecord.find()
        .sort({ matingDate: -1 })
        .populate("doe", "tagId name species breed")
        .populate("buck", "tagId name species breed")
        .lean();
      res.status(200).json(records);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === "POST") {
    try {
      if (!["SuperAdmin", "Manager"].includes(req.user?.role)) {
        return res
          .status(403)
          .json({ error: "Forbidden: Insufficient permissions" });
      }

      const data = req.body;

      if (!data.breedingId || !data.doe || !data.buck || !data.matingDate) {
        return res
          .status(400)
          .json({ error: "breedingId, doe, buck, and matingDate are required" });
      }

      const record = await BreedingRecord.create(data);
      res.status(201).json(record);
    } catch (error) {
      if (error.code === 11000) {
        return res
          .status(409)
          .json({ error: "Breeding record with this ID already exists" });
      }
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}

export default withAuth(handler);
