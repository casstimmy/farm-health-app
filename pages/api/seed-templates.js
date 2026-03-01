import dbConnect from "@/lib/mongodb";
import { withAuth } from "@/utils/middleware";
import SeedTemplate from "@/models/SeedTemplate";
import {
  ANIMAL_SEED_COLUMNS,
  DEFAULT_ANIMAL_SEED_ROWS,
  LOCATIONS_SEED_COLUMNS,
  LOCATIONS_SEED_ROWS,
  INVENTORY_CATEGORIES_SEED_COLUMNS,
  INVENTORY_CATEGORIES_SEED_ROWS,
  INVENTORY_ITEMS_SEED_COLUMNS,
  INVENTORY_ITEMS_SEED_ROWS,
  FEED_TYPES_SEED_COLUMNS,
  FEED_TYPES_SEED_ROWS,
  SERVICES_SEED_COLUMNS,
  SERVICES_SEED_ROWS,
  CUSTOMERS_SEED_COLUMNS,
  CUSTOMERS_SEED_ROWS,
} from "@/lib/seedDefaults";

const SUPPORTED_CATEGORIES = new Set([
  "animals",
  "locations",
  "inventoryCategories",
  "inventoryItems",
  "feedTypes",
  "services",
  "customers"
]);

const SEED_TEMPLATES = {
  animals: { columns: ANIMAL_SEED_COLUMNS, rows: DEFAULT_ANIMAL_SEED_ROWS },
  locations: { columns: LOCATIONS_SEED_COLUMNS, rows: LOCATIONS_SEED_ROWS },
  inventoryCategories: { columns: INVENTORY_CATEGORIES_SEED_COLUMNS, rows: INVENTORY_CATEGORIES_SEED_ROWS },
  inventoryItems: { columns: INVENTORY_ITEMS_SEED_COLUMNS, rows: INVENTORY_ITEMS_SEED_ROWS },
  feedTypes: { columns: FEED_TYPES_SEED_COLUMNS, rows: FEED_TYPES_SEED_ROWS },
  services: { columns: SERVICES_SEED_COLUMNS, rows: SERVICES_SEED_ROWS },
  customers: { columns: CUSTOMERS_SEED_COLUMNS, rows: CUSTOMERS_SEED_ROWS },
};

async function handler(req, res) {
  if (!["GET", "PUT"].includes(req.method)) {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (req.user?.role !== "SuperAdmin") {
    return res.status(403).json({ error: "Forbidden: Only SuperAdmin can manage seed templates" });
  }

  await dbConnect();

  const category = String(req.query.category || req.body?.category || "").trim();
  if (!SUPPORTED_CATEGORIES.has(category)) {
    return res.status(400).json({
      error: `Unsupported category. Currently supported: ${Array.from(SUPPORTED_CATEGORIES).join(", ")}`,
    });
  }

  if (req.method === "GET") {
    const template = await SeedTemplate.findOne({ category }).lean();
    const defaults = SEED_TEMPLATES[category] || SEED_TEMPLATES.animals;

    if (template?.rows?.length) {
      return res.status(200).json({
        category,
        columns: template.columns?.length ? template.columns : defaults.columns,
        rows: template.rows,
        source: "custom",
      });
    }
    return res.status(200).json({
      category,
      columns: defaults.columns,
      rows: defaults.rows,
      source: "default",
    });
  }

  const { rows, columns } = req.body || {};
  if (!Array.isArray(rows)) {
    return res.status(400).json({ error: "rows must be an array of objects" });
  }
  if (rows.length > 5000) {
    return res.status(400).json({ error: "rows too large" });
  }

  const sanitizedRows = rows
    .filter((r) => r && typeof r === "object" && !Array.isArray(r))
    .map((r) => {
      const obj = {};
      Object.keys(r).forEach((k) => {
        obj[String(k).trim()] = r[k];
      });
      return obj;
    });

  const defaults = SEED_TEMPLATES[category] || SEED_TEMPLATES.animals;
  const safeColumns = Array.isArray(columns) && columns.length
    ? columns.map((c) => String(c).trim()).filter(Boolean)
    : defaults.columns;

  const updated = await SeedTemplate.findOneAndUpdate(
    { category },
    {
      category,
      columns: safeColumns,
      rows: sanitizedRows,
      updatedBy: req.user?.id || null,
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  ).lean();

  return res.status(200).json({
    category,
    columns: updated.columns,
    rows: updated.rows,
    source: "custom",
    message: "Seed template saved",
  });
}

export default withAuth(handler);

