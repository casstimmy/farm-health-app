import dbConnect from "@/lib/mongodb";
import Animal from "@/models/Animal";
import { withRBACAuth } from "@/utils/middleware";

async function handler(req, res) {
  await dbConnect();

  const { id } = req.query;

  if (req.method === "GET") {
    try {
      const animal = await Animal.findById(id);
      if (!animal) {
        return res.status(404).json({ error: "Animal not found" });
      }
      res.status(200).json(animal);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === "PUT") {
    try {
      const updatedAnimal = await Animal.findByIdAndUpdate(
        id,
        req.body,
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
      const deletedAnimal = await Animal.findByIdAndDelete(id);

      if (!deletedAnimal) {
        return res.status(404).json({ error: "Animal not found" });
      }

      res.status(200).json({ message: "Animal deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}

export default withRBACAuth(["SuperAdmin", "Manager"])(handler);
