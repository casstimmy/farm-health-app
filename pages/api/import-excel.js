import { withAuth } from "@/utils/middleware";
import dbConnect from "@/lib/mongodb";
import * as XLSX from "xlsx";
import Animal from "@/models/Animal";
import Inventory from "@/models/Inventory";
import Finance from "@/models/Finance";
import Location from "@/models/Location";
import InventoryCategory from "@/models/InventoryCategory";
import FeedType from "@/models/FeedType";

// Map sheet names to model configs
const SHEET_MAP = {
  animals: { model: Animal, unique: "tagId" },
  inventory: { model: Inventory, unique: "item" },
  finance: { model: Finance, unique: null },
  locations: { model: Location, unique: "name" },
  "inventory categories": { model: InventoryCategory, unique: "name" },
  "feed types": { model: FeedType, unique: "name" },
};

async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (req.user.role !== "SuperAdmin") {
    return res.status(403).json({ error: "Only SuperAdmin can import data" });
  }

  try {
    await dbConnect();

    const { fileData, pasteData, dataType } = req.body;

    let rows = [];
    let sheetName = dataType || "animals";

    if (fileData) {
      // Parse base64 Excel/CSV file
      const buffer = Buffer.from(fileData, "base64");
      const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });

      const results = { imported: 0, skipped: 0, sheets: {}, errors: [] };

      for (const name of workbook.SheetNames) {
        const sheet = workbook.Sheets[name];
        const data = XLSX.utils.sheet_to_json(sheet, { defval: "" });
        if (data.length === 0) continue;

        const key = name.toLowerCase().trim();
        const config = SHEET_MAP[key];

        if (!config) {
          results.errors.push(`Sheet "${name}" not recognized. Supported: ${Object.keys(SHEET_MAP).join(", ")}`);
          continue;
        }

        // Clean all rows first
        const cleanRows = data.map(row => {
          const cleanRow = {};
          Object.entries(row).forEach(([k, v]) => {
            const trimKey = k.trim();
            cleanRow[trimKey] = typeof v === "string" ? v.trim() : v;
          });
          return cleanRow;
        });

        let imported = 0;
        let skipped = 0;

        // Pre-fetch all existing unique values in one query to avoid N+1
        let existingSet = new Set();
        if (config.unique) {
          const uniqueVals = cleanRows.map(r => r[config.unique]).filter(Boolean);
          if (uniqueVals.length > 0) {
            const existing = await config.model.find({ [config.unique]: { $in: uniqueVals } }).select(config.unique).lean();
            existingSet = new Set(existing.map(e => String(e[config.unique])));
          }
        }

        // Batch insert non-duplicate rows
        const toInsert = [];
        for (const cleanRow of cleanRows) {
          if (config.unique && cleanRow[config.unique] && existingSet.has(String(cleanRow[config.unique]))) {
            skipped++;
            continue;
          }
          toInsert.push(cleanRow);
        }

        if (toInsert.length > 0) {
          try {
            const inserted = await config.model.insertMany(toInsert, { ordered: false });
            imported = inserted.length;
          } catch (err) {
            // insertMany with ordered:false continues on error; count successes
            if (err.insertedDocs) imported = err.insertedDocs.length;
            if (err.writeErrors) {
              err.writeErrors.forEach(we => results.errors.push(`Row error in ${name}: ${we.errmsg}`));
              skipped += err.writeErrors.length;
            } else {
              results.errors.push(`Batch error in ${name}: ${err.message}`);
            }
          }
        }

        results.sheets[name] = { imported, skipped, total: data.length };
        results.imported += imported;
        results.skipped += skipped;
      }

      return res.status(200).json(results);
    }

    if (pasteData) {
      // Parse pasted tab-separated or comma-separated data
      const lines = pasteData.trim().split("\n").map(l => l.trim()).filter(Boolean);
      if (lines.length < 2) {
        return res.status(400).json({ error: "Pasted data must have a header row plus at least one data row" });
      }

      // Detect delimiter
      const delimiter = lines[0].includes("\t") ? "\t" : ",";
      const headers = lines[0].split(delimiter).map(h => h.trim().replace(/^["']|["']$/g, ""));
      
      const config = SHEET_MAP[sheetName.toLowerCase().trim()];
      if (!config) {
        return res.status(400).json({ error: `Data type "${sheetName}" not supported. Supported: ${Object.keys(SHEET_MAP).join(", ")}` });
      }

      // Parse all rows
      const parsedRows = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(delimiter).map(v => v.trim().replace(/^["']|["']$/g, ""));
        const row = {};
        headers.forEach((h, idx) => { if (values[idx] !== undefined && values[idx] !== "") row[h] = values[idx]; });
        if (Object.keys(row).length > 0) parsedRows.push(row);
      }

      const results = { imported: 0, skipped: 0, errors: [] };

      // Pre-fetch existing unique values in one query
      let existingSet = new Set();
      if (config.unique) {
        const uniqueVals = parsedRows.map(r => r[config.unique]).filter(Boolean);
        if (uniqueVals.length > 0) {
          const existing = await config.model.find({ [config.unique]: { $in: uniqueVals } }).select(config.unique).lean();
          existingSet = new Set(existing.map(e => String(e[config.unique])));
        }
      }

      const toInsert = [];
      for (const row of parsedRows) {
        if (config.unique && row[config.unique] && existingSet.has(String(row[config.unique]))) {
          results.skipped++;
          continue;
        }
        toInsert.push(row);
      }

      if (toInsert.length > 0) {
        try {
          const inserted = await config.model.insertMany(toInsert, { ordered: false });
          results.imported = inserted.length;
        } catch (err) {
          if (err.insertedDocs) results.imported = err.insertedDocs.length;
          if (err.writeErrors) {
            err.writeErrors.forEach(we => results.errors.push(`Row error: ${we.errmsg}`));
            results.skipped += err.writeErrors.length;
          } else {
            results.errors.push(`Batch error: ${err.message}`);
          }
        }
      }

      return res.status(200).json(results);
    }

    return res.status(400).json({ error: "No file data or paste data provided" });

  } catch (error) {
    console.error("Import error:", error);
    return res.status(500).json({ error: error.message });
  }
}

export default withAuth(handler);

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb",
    },
  },
};
