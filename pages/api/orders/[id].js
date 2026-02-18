import dbConnect from "@/lib/mongodb";
import Order from "@/models/Order";
import { withRBACAuth } from "@/utils/middleware";

async function handler(req, res) {
  await dbConnect();
  const { id } = req.query;

  if (req.method === "GET") {
    try {
      const order = await Order.findById(id)
        .populate("customer", "name phone email")
        .populate("location", "name")
        .lean();
      if (!order) return res.status(404).json({ error: "Order not found" });
      return res.status(200).json(order);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method === "PUT") {
    try {
      const payload = req.body || {};
      const order = await Order.findByIdAndUpdate(
        id,
        {
          customer: payload.customer || null,
          location: payload.location || null,
          orderDate: payload.orderDate || new Date(),
          dueDate: payload.dueDate || null,
          status: payload.status || "Pending",
          paymentStatus: payload.paymentStatus || "Unpaid",
          items: Array.isArray(payload.items) ? payload.items : [],
          total: Number(payload.total || 0),
          amountPaid: Number(payload.amountPaid || 0),
          notes: payload.notes || "",
        },
        { new: true, runValidators: true }
      );
      if (!order) return res.status(404).json({ error: "Order not found" });
      return res.status(200).json(order);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method === "DELETE") {
    try {
      const order = await Order.findByIdAndDelete(id);
      if (!order) return res.status(404).json({ error: "Order not found" });
      return res.status(200).json({ message: "Order deleted" });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}

export default withRBACAuth(["SuperAdmin", "Manager"])(handler);
