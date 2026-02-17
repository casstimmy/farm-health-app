import dbConnect from "@/lib/mongodb";
import FeedType from "@/models/FeedType";
import { withAuth } from "@/utils/middleware";

async function handler(req, res) {
  await dbConnect();

  if (req.method === "GET") {
    try {
      const feedTypes = await FeedType.find().sort({ name: 1 }).lean();
      res.status(200).json(feedTypes);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === "POST") {
    try {
      if (!["SuperAdmin", "Manager"].includes(req.user?.role)) {
        return res
          .status(403)
          .json({ error: "Forbidden: Insufficient permissions" });
      }

      const { name, category, purpose, method, description } = req.body;

      if (!name || !name.trim()) {
        return res.status(400).json({ error: "Feed type name is required" });
      }

      const feedType = await FeedType.create({
        name: name.trim(),
        category: category || "",
        purpose: purpose || "",
        method: method || "",
        description: description || "",
      });

      res.status(201).json(feedType);
    } catch (error) {
      if (error.code === 11000) {
        return res
          .status(409)
          .json({ error: "Feed type with this name already exists" });
      }
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}

export default withAuth(handler);
