import dbConnect from "@/lib/mongodb";
import Animal from "@/models/Animal";
import { withRBACAuth } from "@/utils/middleware";

async function handler(req, res) {
  await dbConnect();

  const { id } = req.query;

  if (req.method === "GET") {
    try {
      const animal = await Animal.findById(id).lean();
      if (!animal) {
        return res.status(404).json({ error: "Animal not found" });
      }
      res.status(200).json(animal);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === "PUT") {
    try {
      const updateData = { ...req.body };

      // Handle restore from archive
      if (updateData.restoreFromArchive) {
        delete updateData.restoreFromArchive;
        const restored = await Animal.findByIdAndUpdate(
          id,
          { isArchived: false, archivedAt: null, archivedReason: null },
          { new: true }
        );
        if (!restored) return res.status(404).json({ error: "Animal not found" });
        return res.status(200).json(restored);
      }

      // Convert sire/dam tagId strings to ObjectId refs
      if (updateData.sire && typeof updateData.sire === "string" && !updateData.sire.match(/^[0-9a-fA-F]{24}$/)) {
        const sireAnimal = await Animal.findOne({ tagId: updateData.sire });
        updateData.sire = sireAnimal ? sireAnimal._id : null;
      }
      if (updateData.dam && typeof updateData.dam === "string" && !updateData.dam.match(/^[0-9a-fA-F]{24}$/)) {
        const damAnimal = await Animal.findOne({ tagId: updateData.dam });
        updateData.dam = damAnimal ? damAnimal._id : null;
      }

      // Map legacy field names
      if (updateData.sireId !== undefined) {
        if (!updateData.sire) updateData.sire = updateData.sireId;
        delete updateData.sireId;
      }
      if (updateData.damId !== undefined) {
        if (!updateData.dam) updateData.dam = updateData.damId;
        delete updateData.damId;
      }
      if (updateData.weight !== undefined && updateData.currentWeight === undefined) {
        updateData.currentWeight = updateData.weight;
        delete updateData.weight;
      }
      delete updateData.myNotes;

      const updatedAnimal = await Animal.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      );

      if (!updatedAnimal) {
        return res.status(404).json({ error: "Animal not found" });
      }

      res.status(200).json(updatedAnimal);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === "DELETE") {
    try {
      // Archive instead of permanently deleting to preserve data integrity
      const reason = req.body?.reason || "Archived by user";
      const archivedAnimal = await Animal.findByIdAndUpdate(
        id,
        { 
          isArchived: true, 
          archivedAt: new Date(), 
          archivedReason: reason 
        },
        { new: true }
      );

      if (!archivedAnimal) {
        return res.status(404).json({ error: "Animal not found" });
      }

      res.status(200).json({ message: "Animal archived successfully", animal: archivedAnimal });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}

export default withRBACAuth(["SuperAdmin", "Manager"])(handler);
