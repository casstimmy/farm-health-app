import dbConnect from "@/lib/mongodb";
import Inventory from "@/models/Inventory";
import { withAuth } from "@/utils/middleware";

async function handler(req, res) {
  await dbConnect();
  const { id } = req.query;

  if (req.method === "GET") {
    try {
      const item = await Inventory.findById(id);
      if (!item) {
        return res.status(404).json({ error: "Item not found" });
      }
      res.status(200).json(item);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === "PUT") {
    try {
      // Only SuperAdmin and Manager can update inventory
      if (!["SuperAdmin", "Manager"].includes(req.user?.role)) {
        return res.status(403).json({ error: "Forbidden: Insufficient permissions" });
      }

      const item = await Inventory.findByIdAndUpdate(
        id,
        req.body,
        { new: true, runValidators: true }
      );

      if (!item) {
        return res.status(404).json({ error: "Item not found" });
      }

      res.status(200).json(item);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === "DELETE") {
    try {
      // Only SuperAdmin can delete inventory
      if (req.user?.role !== "SuperAdmin") {
        return res.status(403).json({ error: "Forbidden: Only SuperAdmin can delete items" });
      }

      const item = await Inventory.findByIdAndDelete(id);

      if (!item) {
        return res.status(404).json({ error: "Item not found" });
      }

      res.status(200).json({ message: "Item deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}

export default withAuth(handler);
