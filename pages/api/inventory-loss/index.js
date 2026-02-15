import dbConnect from "@/lib/mongodb";
import InventoryLoss from "@/models/InventoryLoss";
import Inventory from "@/models/Inventory";
import { withAuth } from "@/utils/middleware";

async function handler(req, res) {
  await dbConnect();

  if (req.method === "GET") {
    try {
      const { inventoryItem, type } = req.query;
      const filter = {};
      if (inventoryItem) filter.inventoryItem = inventoryItem;
      if (type) filter.type = type;

      const records = await InventoryLoss.find(filter)
        .sort({ date: -1 })
        .populate("inventoryItem", "item category unit");
      res.status(200).json(records);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === "POST") {
    try {
      // Only SuperAdmin and Manager can record losses
      if (!["SuperAdmin", "Manager"].includes(req.user?.role)) {
        return res.status(403).json({ error: "Forbidden: Insufficient permissions" });
      }

      const data = req.body;

      if (!data.inventoryItem || !data.type || !data.quantity) {
        return res.status(400).json({ error: "inventoryItem, type, and quantity are required" });
      }

      // Look up unit cost from inventory if not provided
      if (!data.unitCost) {
        const inv = await Inventory.findById(data.inventoryItem);
        if (inv) {
          data.unitCost = inv.costPrice || inv.price || 0;
          data.itemName = data.itemName || inv.item;
        }
      }

      data.totalLoss = (data.unitCost || 0) * (data.quantity || 0);

      const record = await InventoryLoss.create({
        inventoryItem: data.inventoryItem,
        itemName: data.itemName || "",
        type: data.type,
        quantity: data.quantity,
        unitCost: data.unitCost || 0,
        totalLoss: data.totalLoss || 0,
        date: data.date || new Date(),
        reason: data.reason || "",
        reportedBy: data.reportedBy || req.user?.name || "",
        notes: data.notes || "",
      });

      res.status(201).json({ message: "Loss record created", record });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}

export default withAuth(handler);
