import dbConnect from "@/lib/mongodb";
import Treatment from "@/models/Treatment";
import Animal from "@/models/Animal";
import { withAuth } from "@/utils/middleware";

async function handler(req, res) {
  await dbConnect();

  if (req.method === "POST") {
    try {
      const { animal, ...treatmentData } = req.body;
      if (!animal) {
        return res.status(400).json({ error: "animal (ObjectId) required" });
      }
      const treatment = await Treatment.create({ ...treatmentData, animal });
      res.status(201).json({ message: "Treatment record added", treatment });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === "GET") {
    try {
      // Return all treatments, populated with animal details
      const treatments = await Treatment.find().populate('animal');
      res.status(200).json(treatments);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}

export default withAuth(handler);
