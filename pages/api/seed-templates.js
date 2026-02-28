import dbConnect from "@/lib/mongodb";
import { withAuth } from "@/utils/middleware";
import SeedTemplate from "@/models/SeedTemplate";
import { ANIMAL_SEED_COLUMNS, DEFAULT_ANIMAL_SEED_ROWS } from "@/lib/seedDefaults";

const SUPPORTED_CATEGORIES = new Set(["animals"]);

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
    return res.status(400).json({ error: "Unsupported category. Currently supported: animals" });
  }

  if (req.method === "GET") {
    const template = await SeedTemplate.findOne({ category }).lean();
    if (template?.rows?.length) {
      return res.status(200).json({
        category,
        columns: template.columns?.length ? template.columns : ANIMAL_SEED_COLUMNS,
        rows: template.rows,
        source: "custom",
      });
    }
    return res.status(200).json({
      category,
      columns: ANIMAL_SEED_COLUMNS,
      rows: DEFAULT_ANIMAL_SEED_ROWS,
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

  const safeColumns = Array.isArray(columns) && columns.length
    ? columns.map((c) => String(c).trim()).filter(Boolean)
    : ANIMAL_SEED_COLUMNS;

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

