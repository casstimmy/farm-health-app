import dbConnect from "@/lib/mongodb";
import MortalityRecord from "@/models/MortalityRecord";
import { withAuth } from "@/utils/middleware";
import mongoose from "mongoose";

async function handler(req, res) {
  await dbConnect();

  if (req.method === "GET") {
    try {
      let records = await MortalityRecord.find()
        .sort({ dateOfDeath: -1 })
        .populate("animal", "tagId name species breed gender")
        .populate("location", "name")
        .lean();

      // Backward compatibility for legacy collection names.
      if (!records.length) {
        const legacy = await mongoose.connection
          .collection("mortalities")
          .find({})
          .sort({ dateOfDeath: -1 })
          .toArray();

        if (legacy.length) {
          const animalIds = Array.from(
            new Set(
              legacy
                .map((r) => String(r.animal || ""))
                .filter((id) => /^[0-9a-fA-F]{24}$/.test(id))
            )
          ).map((id) => new mongoose.Types.ObjectId(id));

          const animals = animalIds.length
            ? await mongoose.connection.collection("animals").find({ _id: { $in: animalIds } }).toArray()
            : [];
          const animalMap = new Map(animals.map((a) => [String(a._id), a]));

          records = legacy.map((r) => ({
            ...r,
            animal: animalMap.get(String(r.animal)) || r.animal,
          }));
        }
      }
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
