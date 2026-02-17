import dbConnect from "@/lib/mongodb";
import MedicationLookup from "@/models/MedicationLookup";
import { withAuth } from "@/utils/middleware";

async function handler(req, res) {
  await dbConnect();

  if (req.method === "GET") {
    try {
      const { type } = req.query;
      const filter = type ? { type } : {};
      const lookups = await MedicationLookup.find(filter).sort({ value: 1 }).lean();
      return res.status(200).json(lookups);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method === "POST") {
    try {
      if (!["SuperAdmin", "Manager"].includes(req.user?.role)) {
        return res.status(403).json({ error: "Forbidden: Insufficient permissions" });
      }

      const { type, value } = req.body || {};
      if (!type || !value) {
        return res.status(400).json({ error: "Type and value are required" });
      }

      const created = await MedicationLookup.create({
        type: type.trim(),
        value: value.trim(),
      });
      return res.status(201).json(created);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}

export default withAuth(handler);
