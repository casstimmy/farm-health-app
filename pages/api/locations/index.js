import dbConnect from "@/lib/mongodb";
import Location from "@/models/Location";
import { requireAuth } from "@/utils/middleware";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method === "GET") {
    try {
      const locations = await Location.find({ isActive: true }).sort({ name: 1 }).lean();
      return res.status(200).json(locations);
    } catch (error) {
      console.error("Error fetching locations:", error);
      return res.status(500).json({ error: "Failed to fetch locations" });
    }
  }

  if (req.method === "POST") {
    try {
      const { name, description, address, city, state } = req.body;

      if (!name) {
        return res.status(400).json({ error: "Location name is required" });
      }

      const existingLocation = await Location.findOne({ name });
      if (existingLocation) {
        return res.status(400).json({ error: "Location already exists" });
      }

      const location = new Location({
        name,
        description,
        address,
        city,
        state,
        isActive: true,
      });

      await location.save();
      return res.status(201).json(location);
    } catch (error) {
      console.error("Error creating location:", error);
      return res.status(500).json({ error: "Failed to create location" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
