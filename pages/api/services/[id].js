import dbConnect from "@/lib/mongodb";
import Service from "@/models/Service";
import { withAuth } from "@/utils/middleware";

async function handler(req, res) {
  await dbConnect();
  const { id } = req.query;

  if (req.method === "GET") {
    try {
      const service = await Service.findById(id).lean();
      if (!service) return res.status(404).json({ error: "Service not found" });
      res.status(200).json(service);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === "PUT") {
    try {
      if (!["SuperAdmin", "Manager"].includes(req.user?.role)) {
        return res.status(403).json({ error: "Forbidden" });
      }
      const service = await Service.findByIdAndUpdate(id, req.body, {
        new: true,
        runValidators: true,
      });
      if (!service) return res.status(404).json({ error: "Service not found" });
      res.status(200).json(service);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === "DELETE") {
    try {
      if (req.user?.role !== "SuperAdmin") {
        return res.status(403).json({ error: "Only SuperAdmin can delete services" });
      }
      const service = await Service.findByIdAndDelete(id);
      if (!service) return res.status(404).json({ error: "Service not found" });
      res.status(200).json({ message: "Service deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}

export default withAuth(handler);
