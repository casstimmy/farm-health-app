import { withAuth } from "@/utils/middleware";
import dbConnect from "@/lib/mongodb";

async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Check admin role
  if (req.user.role !== "SuperAdmin") {
    return res.status(403).json({ error: "Only SuperAdmin can import data" });
  }

  try {
    await dbConnect();

    // This is a placeholder endpoint for Excel import
    // In production, you'd use a library like 'xlsx' to parse the file
    // For now, return a helpful message about the expected format
    return res.status(200).json({
      imported: 0,
      skipped: 0,
      message: "Excel import requires the 'xlsx' package. Install it with: npm install xlsx",
      errors: [
        "Excel import is available but requires the 'xlsx' npm package to be installed.",
        "Run: npm install xlsx",
        "Then restart the server to enable Excel/CSV import functionality."
      ],
    });
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
