import dbConnect from "@/lib/mongodb";
import BreedingRecord from "@/models/BreedingRecord";
import "@/models/Animal";
import "@/models/Location";
import { withAuth } from "@/utils/middleware";
import mongoose from "mongoose";

async function handler(req, res) {
  await dbConnect();

  if (req.method === "GET") {
    try {
      let records = await BreedingRecord.find()
        .sort({ matingDate: -1 })
        .populate("doe", "tagId name species breed")
        .populate("buck", "tagId name species breed")
        .populate("location", "name")
        .lean();

      // Backward compatibility for legacy collection names.
      if (!records.length) {
        const legacy = await mongoose.connection
          .collection("breedings")
          .find({})
          .sort({ matingDate: -1 })
          .toArray();

        if (legacy.length) {
          const animalIds = Array.from(
            new Set(
              legacy
                .flatMap((r) => [String(r.doe || ""), String(r.buck || "")])
                .filter((id) => /^[0-9a-fA-F]{24}$/.test(id))
            )
          ).map((id) => new mongoose.Types.ObjectId(id));

          const locationIds = Array.from(
            new Set(
              legacy
                .map((r) => String(r.location || ""))
                .filter((id) => /^[0-9a-fA-F]{24}$/.test(id))
            )
          ).map((id) => new mongoose.Types.ObjectId(id));

          const [animals, locations] = await Promise.all([
            animalIds.length ? mongoose.connection.collection("animals").find({ _id: { $in: animalIds } }).toArray() : [],
            locationIds.length ? mongoose.connection.collection("locations").find({ _id: { $in: locationIds } }).toArray() : [],
          ]);

          const animalMap = new Map(animals.map((a) => [String(a._id), a]));
          const locationMap = new Map(locations.map((l) => [String(l._id), l]));

          records = legacy.map((r) => ({
            ...r,
            doe: animalMap.get(String(r.doe)) || r.doe,
            buck: animalMap.get(String(r.buck)) || r.buck,
            location: locationMap.get(String(r.location)) || r.location,
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
