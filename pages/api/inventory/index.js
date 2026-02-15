import dbConnect from "@/lib/mongodb";
import Inventory from "@/models/Inventory";
import Medication from "@/models/Medication";
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
        categoryId: inventoryData.categoryId || undefined,
        categoryName: inventoryData.categoryName || inventoryData.category || undefined,
        minStock: inventoryData.minStock,
        price: inventoryData.price,
        costPrice: inventoryData.costPrice || 0,
        marginPercent: inventoryData.marginPercent || 0,
        salesPrice: inventoryData.salesPrice || 0,
        unit: inventoryData.unit,
        medication: inventoryData.medication || undefined,
        dateAdded: inventoryData.dateAdded || new Date(),
      });

      await newItem.save();

      if ((inventoryData.categoryName || inventoryData.category) === "Medication") {
        await Medication.create({
          name: inventoryData.item,
          details: inventoryData.medication?.details,
          expiration: inventoryData.medication?.expiration,
          classCategory: inventoryData.medication?.classCategory,
          purpose: inventoryData.medication?.purpose,
          recommendedDosage: inventoryData.medication?.recommendedDosage,
          route: inventoryData.medication?.route,
          supplier: inventoryData.medication?.supplier,
          inventoryItem: newItem._id,
        });
      }

      res.status(201).json(newItem);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}

export default withAuth(handler);
