import dbConnect from "@/lib/mongodb";
import MortalityRecord from "@/models/MortalityRecord";
import { withAuth } from "@/utils/middleware";

async function handler(req, res) {
  await dbConnect();

  if (req.method === "GET") {
    try {
      const records = await MortalityRecord.find()
        .sort({ dateOfDeath: -1 })
        .populate("animal", "tagId name species breed gender")
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

      if (!data.animal || !data.dateOfDeath) {
        return res
          .status(400)
          .json({ error: "animal and dateOfDeath are required" });
      }

      // Post-save hook will automatically set Animal.status = "Dead"
      const record = await MortalityRecord.create(data);
      res.status(201).json(record);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}

export default withAuth(handler);
