import dbConnect from "@/lib/mongodb";
import Animal from "@/models/Animal";
import { withAuth, withRBACAuth } from "@/utils/middleware";

async function handler(req, res) {
  await dbConnect();

  if (req.method === "GET") {
    try {
      // All authenticated users can view animals
      const { archived } = req.query;
      const filter = archived === "true" 
        ? { isArchived: true } 
        : { isArchived: { $ne: true } };
      const animals = await Animal.find(filter)
        .populate("sire", "tagId name")
        .populate("dam", "tagId name")
        .populate("location", "name")
        .sort({ createdAt: -1 })
        .lean();
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

      // Convert sire/dam tagId strings to ObjectId refs
      if (animalData.sire && typeof animalData.sire === "string" && !animalData.sire.match(/^[0-9a-fA-F]{24}$/)) {
        const sireAnimal = await Animal.findOne({ tagId: animalData.sire });
        animalData.sire = sireAnimal ? sireAnimal._id : null;
      }
      if (animalData.dam && typeof animalData.dam === "string" && !animalData.dam.match(/^[0-9a-fA-F]{24}$/)) {
        const damAnimal = await Animal.findOne({ tagId: animalData.dam });
        animalData.dam = damAnimal ? damAnimal._id : null;
      }

      // Map legacy field names
      if (animalData.sireId !== undefined) {
        if (!animalData.sire) animalData.sire = animalData.sireId;
        delete animalData.sireId;
      }
      if (animalData.damId !== undefined) {
        if (!animalData.dam) animalData.dam = animalData.damId;
        delete animalData.damId;
      }
      if (animalData.weight !== undefined && animalData.currentWeight === undefined) {
        animalData.currentWeight = animalData.weight;
        delete animalData.weight;
      }
      // Remove fields that no longer exist on the model
      delete animalData.myNotes;

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
