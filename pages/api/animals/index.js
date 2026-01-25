import dbConnect from "@/lib/mongodb";
import Animal from "@/models/Animal";
import { withAuth, withRBACAuth } from "@/utils/middleware";

async function handler(req, res) {
  await dbConnect();

  if (req.method === "GET") {
    try {
      // All authenticated users can view animals
      const animals = await Animal.find().sort({ createdAt: -1 });
      res.status(200).json(animals);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === "POST") {
    try {
      // Only SuperAdmin and Manager can create animals
      if (!["SuperAdmin", "Manager"].includes(req.user?.role)) {
        return res.status(403).json({ error: "Forbidden: Insufficient permissions" });
      }

      const animalData = req.body;

      if (!animalData.tagId) {
        return res.status(400).json({ error: "tagId is required" });
      }

      const newAnimal = new Animal({
        ...animalData,
        createdAt: new Date()
      });

      await newAnimal.save();
      res.status(201).json(newAnimal);
    } catch (error) {
      if (error.code === 11000) {
        return res.status(409).json({ error: "Animal with this tagId already exists" });
      }
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}

export default withAuth(handler);
