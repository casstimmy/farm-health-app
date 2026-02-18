import dbConnect from "@/lib/mongodb";
import Customer from "@/models/Customer";
import { withRBACAuth } from "@/utils/middleware";

async function handler(req, res) {
  await dbConnect();
  const { id } = req.query;

  if (req.method === "GET") {
    try {
      const customer = await Customer.findById(id).populate("location", "name").lean();
      if (!customer) return res.status(404).json({ error: "Customer not found" });
      return res.status(200).json(customer);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method === "PUT") {
    try {
      const payload = req.body || {};
      const customer = await Customer.findByIdAndUpdate(
        id,
        {
          name: payload.name,
          phone: payload.phone || "",
          email: payload.email || "",
          address: payload.address || "",
          location: payload.location || null,
          isActive: payload.isActive !== false,
          notes: payload.notes || "",
        },
        { new: true, runValidators: true }
      );

      if (!customer) return res.status(404).json({ error: "Customer not found" });
      return res.status(200).json(customer);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method === "DELETE") {
    try {
      const customer = await Customer.findByIdAndDelete(id);
      if (!customer) return res.status(404).json({ error: "Customer not found" });
      return res.status(200).json({ message: "Customer deleted" });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}

export default withRBACAuth(["SuperAdmin", "Manager"])(handler);
