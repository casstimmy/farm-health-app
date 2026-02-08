import dbConnect from "@/lib/mongodb";
import InventoryCategory from "@/models/InventoryCategory";
import { withAuth } from "@/utils/middleware";

async function handler(req, res) {
  await dbConnect();
  const { id } = req.query;

  if (req.method === "PUT") {
    try {
      if (!["SuperAdmin", "Manager"].includes(req.user?.role)) {
        return res.status(403).json({ error: "Forbidden: Insufficient permissions" });
      }

      const { name, description } = req.body || {};
      if (!name || !name.trim()) {
        return res.status(400).json({ error: "Category name is required" });
      }

      const updated = await InventoryCategory.findByIdAndUpdate(
        id,
        { name: name.trim(), description: description?.trim() || "" },
        { new: true, runValidators: true }
      );

      if (!updated) {
        return res.status(404).json({ error: "Category not found" });
      }

      return res.status(200).json(updated);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method === "DELETE") {
    try {
      if (req.user?.role !== "SuperAdmin") {
        return res.status(403).json({ error: "Forbidden: Only SuperAdmin can delete categories" });
      }

      const deleted = await InventoryCategory.findByIdAndDelete(id);
      if (!deleted) {
        return res.status(404).json({ error: "Category not found" });
      }

      return res.status(200).json({ message: "Category deleted successfully" });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}

export default withAuth(handler);
