import dbConnect from "@/lib/mongodb";
import InventoryLoss from "@/models/InventoryLoss";
import { withAuth } from "@/utils/middleware";

async function handler(req, res) {
  await dbConnect();
  const { id } = req.query;

  if (req.method === "GET") {
    try {
      const record = await InventoryLoss.findById(id).populate("inventoryItem", "item category unit").lean();
      if (!record) return res.status(404).json({ error: "Record not found" });
      res.status(200).json(record);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === "DELETE") {
    try {
      if (req.user?.role !== "SuperAdmin") {
        return res.status(403).json({ error: "Forbidden: Only SuperAdmin can delete loss records" });
      }
      const record = await InventoryLoss.findByIdAndDelete(id);
      if (!record) return res.status(404).json({ error: "Record not found" });
      res.status(200).json({ message: "Loss record deleted" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}

export default withAuth(handler);
