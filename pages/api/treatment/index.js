import dbConnect from "@/lib/mongodb";
import Treatment from "@/models/Treatment";
import Animal from "@/models/Animal";
import { withAuth } from "@/utils/middleware";

async function handler(req, res) {
  await dbConnect();

  if (req.method === "POST") {
    try {
      console.log("[Treatment API] POST body:", req.body);
      const { animal, ...treatmentData } = req.body;
      if (!animal) {
        console.error("[Treatment API] Missing animal field in POST body:", req.body);
        return res.status(400).json({ error: "animal (ObjectId) required" });
      }
      const treatment = await Treatment.create({ ...treatmentData, animal });
      res.status(201).json({ message: "Treatment record added", treatment });
    } catch (error) {
      console.error("[Treatment API] Error:", error);
      res.status(500).json({ error: error.message, stack: error.stack });
    }
  } else if (req.method === "GET") {
    try {
      // Return all treatments, populated with animal details
      const treatments = await Treatment.find().populate('animal').lean();
      res.status(200).json(treatments);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}

export default withAuth(handler);
