import dbConnect from "@/lib/mongodb";
import InventoryCategory from "@/models/InventoryCategory";
import { withAuth } from "@/utils/middleware";

async function handler(req, res) {
  await dbConnect();

  if (req.method === "GET") {
    try {
      const categories = await InventoryCategory.find().sort({ name: 1 });
      return res.status(200).json(categories);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method === "POST") {
    try {
      if (!["SuperAdmin", "Manager"].includes(req.user?.role)) {
        return res.status(403).json({ error: "Forbidden: Insufficient permissions" });
      }

      const { name, description } = req.body || {};
      if (!name || !name.trim()) {
        return res.status(400).json({ error: "Category name is required" });
      }

      const created = await InventoryCategory.create({
        name: name.trim(),
        description: description?.trim() || "",
      });
      return res.status(201).json(created);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}

export default withAuth(handler);
