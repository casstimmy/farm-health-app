import dbConnect from "@/lib/mongodb";
import Customer from "@/models/Customer";
import { withRBACAuth } from "@/utils/middleware";

async function handler(req, res) {
  await dbConnect();

  if (req.method === "GET") {
    try {
      const { q = "", location = "all", active = "all" } = req.query;
      const query = {};

      if (location !== "all") query.location = location;
      if (active !== "all") query.isActive = active === "true";
      if (q) {
        query.$or = [
          { name: { $regex: q, $options: "i" } },
          { phone: { $regex: q, $options: "i" } },
          { email: { $regex: q, $options: "i" } },
        ];
      }

      const customers = await Customer.find(query)
        .sort({ createdAt: -1 })
        .populate("location", "name")
        .lean();
      return res.status(200).json(customers);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method === "POST") {
    try {
      const payload = req.body || {};
      if (!payload.name?.trim()) {
        return res.status(400).json({ error: "Customer name is required" });
      }

      const customer = await Customer.create({
        name: payload.name,
        phone: payload.phone || "",
        email: payload.email || "",
        address: payload.address || "",
        location: payload.location || null,
        isActive: payload.isActive !== false,
        notes: payload.notes || "",
      });

      return res.status(201).json(customer);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}

export default withRBACAuth(["SuperAdmin", "Manager"])(handler);
