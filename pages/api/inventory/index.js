import dbConnect from "@/lib/mongodb";
import Inventory from "@/models/Inventory";
import { withAuth, withRBACAuth } from "@/utils/middleware";

async function handler(req, res) {
  await dbConnect();

  if (req.method === "GET") {
    try {
      // All authenticated users can view inventory
      const inventory = await Inventory.find().sort({ dateAdded: -1 });
      res.status(200).json(inventory);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === "POST") {
    try {
      // Only SuperAdmin and Manager can create/modify inventory
      if (!["SuperAdmin", "Manager"].includes(req.user?.role)) {
        return res.status(403).json({ error: "Forbidden: Insufficient permissions" });
      }

      const inventoryData = req.body;

      const newItem = new Inventory({
        item: inventoryData.item,
        quantity: inventoryData.quantity,
        category: inventoryData.category,
        dateAdded: inventoryData.dateAdded || new Date()
      });

      await newItem.save();
      res.status(201).json(newItem);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}

export default withAuth(handler);
