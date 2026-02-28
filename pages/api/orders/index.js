import dbConnect from "@/lib/mongodb";
import Order from "@/models/Order";
import mongoose from "mongoose";
import { withRBACAuth } from "@/utils/middleware";

function buildOrderNumber() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `ORD-${y}${m}${day}-${rand}`;
}

async function handler(req, res) {
  await dbConnect();

  if (req.method === "GET") {
    try {
      const { status = "all", location = "all", customer = "", q = "" } = req.query;
      const query = {};

      if (status !== "all") query.status = status;
      if (location !== "all") query.location = /^[0-9a-fA-F]{24}$/.test(String(location)) ? new mongoose.Types.ObjectId(String(location)) : location;
      if (customer) query.customer = /^[0-9a-fA-F]{24}$/.test(String(customer)) ? new mongoose.Types.ObjectId(String(customer)) : customer;
      if (q) {
        query.$or = [
          { orderNumber: { $regex: q, $options: "i" } },
          { customerName: { $regex: q, $options: "i" } },
          { customerEmail: { $regex: q, $options: "i" } },
        ];
      }

      const orders = await mongoose.connection
        .collection("orders")
        .find(query)
        .sort({ createdAt: -1 })
        .toArray();

      return res.status(200).json(orders);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method === "POST") {
    try {
      const payload = req.body || {};
      const order = await Order.create({
        orderNumber: payload.orderNumber || buildOrderNumber(),
        customer: payload.customer || null,
        location: payload.location || null,
        orderDate: payload.orderDate || new Date(),
        dueDate: payload.dueDate || null,
        status: payload.status || "Pending",
        paymentStatus: payload.paymentStatus || "Unpaid",
        items: Array.isArray(payload.items) ? payload.items : [],
        total: Number(payload.total || 0),
        amountPaid: Number(payload.amountPaid || 0),
        recordedBy: payload.recordedBy || req.user?.name || "System",
        notes: payload.notes || "",
      });

      return res.status(201).json(order);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}

export default withRBACAuth(["SuperAdmin", "Manager"])(handler);
