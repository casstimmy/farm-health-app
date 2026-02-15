import dbConnect from "@/lib/mongodb";
import VaccinationRecord from "@/models/VaccinationRecord";
import { withAuth } from "@/utils/middleware";

async function handler(req, res) {
  await dbConnect();

  if (req.method === "GET") {
    try {
      const { animalId } = req.query;
      const query = animalId ? { animal: animalId } : {};
      const records = await VaccinationRecord.find(query)
        .sort({ vaccinationDate: -1 })
        .populate("animal", "tagId name species breed");
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

      if (!data.animal || !data.vaccineName || !data.vaccinationDate) {
        return res
          .status(400)
          .json({ error: "animal, vaccineName, and vaccinationDate are required" });
      }

      const record = await VaccinationRecord.create(data);
      res.status(201).json(record);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}

export default withAuth(handler);
