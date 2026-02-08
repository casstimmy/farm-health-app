import dbConnect from "@/lib/mongodb";
import Inventory from "@/models/Inventory";
import Medication from "@/models/Medication";
import InventoryCategory from "@/models/InventoryCategory";
import MedicationLookup from "@/models/MedicationLookup";
import { withAuth } from "@/utils/middleware";

async function handler(req, res) {
  await dbConnect();

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!["SuperAdmin", "Manager"].includes(req.user?.role)) {
    return res.status(403).json({ error: "Forbidden: Insufficient permissions" });
  }

  try {
    const parseDate = (value) => {
      if (!value) return undefined;
      const trimmed = String(value).trim();
      if (!trimmed) return undefined;
      const parts = trimmed.split("/");
      if (parts.length === 2) {
        const [month, year] = parts.map((p) => parseInt(p, 10));
        if (!Number.isNaN(month) && !Number.isNaN(year)) {
          return new Date(Date.UTC(year, month - 1, 1));
        }
      }
      if (parts.length === 3) {
        const [p1, p2, p3] = parts.map((p) => parseInt(p, 10));
        if (!Number.isNaN(p1) && !Number.isNaN(p2) && !Number.isNaN(p3)) {
          const dayFirst = p1 > 12 || p2 <= 12;
          const day = dayFirst ? p1 : p2;
          const month = dayFirst ? p2 : p1;
          return new Date(Date.UTC(p3, month - 1, day));
        }
      }
      const fallback = new Date(trimmed);
      return Number.isNaN(fallback.getTime()) ? undefined : fallback;
    };

    const { items } = req.body || {};
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Items array is required" });
    }

    let medicationCategory = await InventoryCategory.findOne({ name: "Medication" });
    if (!medicationCategory) {
      medicationCategory = await InventoryCategory.create({ name: "Medication", description: "Medication items" });
    }

    const created = [];
    for (const item of items) {
      if (!item?.name) {
        continue;
      }

      const inventoryItem = await Inventory.create({
        item: item.name,
        quantity: item.quantity || 0,
        category: "Medication",
        categoryId: medicationCategory?._id,
        categoryName: "Medication",
        minStock: item.minStock,
        price: item.price,
        unit: item.unit,
        medication: {
          details: item.details,
          expiration: parseDate(item.expiration),
          classCategory: item.classCategory,
          purpose: item.purpose,
          recommendedDosage: item.recommendedDosage,
          route: item.route,
          supplier: item.supplier,
        },
        dateAdded: new Date(),
      });

      const medication = await Medication.create({
        name: item.name,
        details: item.details,
        expiration: parseDate(item.expiration),
        classCategory: item.classCategory,
        purpose: item.purpose,
        recommendedDosage: item.recommendedDosage,
        route: item.route,
        supplier: item.supplier,
        inventoryItem: inventoryItem._id,
      });

      const lookupPairs = [
        ["classCategory", item.classCategory],
        ["purpose", item.purpose],
        ["recommendedDosage", item.recommendedDosage],
        ["route", item.route],
        ["supplier", item.supplier],
      ];

      for (const [type, value] of lookupPairs) {
        if (!value) continue;
        await MedicationLookup.updateOne(
          { type, value: value.trim() },
          { $setOnInsert: { type, value: value.trim() } },
          { upsert: true }
        );
      }

      created.push({ inventoryItem, medication });
    }

    return res.status(201).json({ count: created.length });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

export default withAuth(handler);
