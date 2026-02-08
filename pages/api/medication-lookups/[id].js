import dbConnect from "@/lib/mongodb";
import MedicationLookup from "@/models/MedicationLookup";
import { withAuth } from "@/utils/middleware";

async function handler(req, res) {
  await dbConnect();
  const { id } = req.query;

  if (req.method === "DELETE") {
    try {
      if (req.user?.role !== "SuperAdmin") {
        return res.status(403).json({ error: "Forbidden: Only SuperAdmin can delete entries" });
      }

      const deleted = await MedicationLookup.findByIdAndDelete(id);
      if (!deleted) {
        return res.status(404).json({ error: "Entry not found" });
      }

      return res.status(200).json({ message: "Entry deleted successfully" });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}

export default withAuth(handler);
