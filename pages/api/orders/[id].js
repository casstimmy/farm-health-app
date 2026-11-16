import dbConnect from "@/lib/mongodb";
import Order from "@/models/Order";
import { withRBACAuth } from "@/utils/middleware";
import { ADMIN, MANAGE } from "@/utils/permissions";
import { denyIfOutsideLocation } from "@/utils/recordAccess";

async function handler(req, res) {
  await dbConnect();
  const { id } = req.query;

  // Staff may only touch records that belong to their own location(s).
  if (await denyIfOutsideLocation(req, res, Order, id)) return;

  if (req.method === "GET") {
    try {
      const order = await Order.findById(id).lean();
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
        { $set: { ...payload, updatedAt: new Date() } },
        { new: true, runValidators: false }
      ).lean();
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

export default withRBACAuth(MANAGE, { DELETE: ADMIN })(handler);
