import dbConnect from "@/lib/mongodb";
import Service from "@/models/Service";
import { withAuth } from "@/utils/middleware";

async function handler(req, res) {
  await dbConnect();

  if (req.method === "GET") {
    try {
      const { category, showOnSite } = req.query;
      const filter = {};
      if (category && category !== "all") filter.category = category;
      if (showOnSite === "true") filter.showOnSite = true;

      const services = await Service.find(filter).sort({ createdAt: -1 });
      res.status(200).json(services);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === "POST") {
    try {
      if (!["SuperAdmin", "Manager"].includes(req.user?.role)) {
        return res.status(403).json({ error: "Forbidden" });
      }

      const { name, category } = req.body;
      if (!name) return res.status(400).json({ error: "Service name is required" });

      const service = await Service.create(req.body);
      res.status(201).json(service);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}

export default withAuth(handler);
