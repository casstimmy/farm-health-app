import dbConnect from "@/lib/mongodb";
import Animal from "@/models/Animal";
import { withAuth } from "@/utils/middleware";

async function handler(req, res) {
  await dbConnect();

  if (req.method === "POST") {
    try {
      const { animalId, treatmentData } = req.body;

      if (!animalId || !treatmentData) {
        return res.status(400).json({ error: "animalId and treatmentData required" });
      }

      const animal = await Animal.findById(animalId);
      if (!animal) {
        return res.status(404).json({ error: "Animal not found" });
      }

      const treatment = {
        date: treatmentData.date || new Date(),
        symptoms: treatmentData.symptoms,
        possibleCause: treatmentData.possibleCause,
        diagnosis: treatmentData.diagnosis,
        treatmentType: treatmentData.treatmentType,
        medication: treatmentData.medication,
        treatedBy: treatmentData.treatedBy || req.user.name,
        postTreatmentObservation: treatmentData.postTreatmentObservation,
        treatmentCompletionDate: treatmentData.treatmentCompletionDate,
        recoveryStatus: treatmentData.recoveryStatus
      };

      animal.treatmentHistory.push(treatment);
      await animal.save();

      res.status(201).json({ message: "Treatment record added", treatment });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === "GET") {
    try {
      const { animalId } = req.query;

      if (!animalId) {
        return res.status(400).json({ error: "animalId required" });
      }

      const animal = await Animal.findById(animalId);
      if (!animal) {
        return res.status(404).json({ error: "Animal not found" });
      }

      res.status(200).json(animal.treatmentHistory);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}

export default withAuth(handler);
