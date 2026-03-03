import dbConnect from "@/lib/mongodb";
import Order from "@/models/Order";
import Task from "@/models/Task";
import User from "@/models/User";
import mongoose from "mongoose";
import { withRBACAuth } from "@/utils/middleware";
import { createNotifications } from "@/utils/notifications";
import { buildLocationFilter } from "@/utils/locationAccess";

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

      // Apply location-based access control
      const locFilter = buildLocationFilter(req.user);
      if (locFilter) Object.assign(query, locFilter);

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

      // Auto-create a task for the new order
      try {
        const itemsSummary = (order.items || []).map((i) => i.description || "Item").join(", ");
        await Task.create({
          title: `New Order: ${order.orderNumber}`,
          description: `Order ${order.orderNumber} has been placed. Items: ${itemsSummary || "N/A"}. Total: ${order.total || 0}`,
          category: "Other",
          priority: "High",
          status: "Pending",
          assignedBy: req.user.id,
          location: order.location || null,
          dueDate: order.dueDate || null,
          notes: `Order auto-generated task. Notes: ${order.notes || "None"}`,
        });
      } catch (taskErr) {
        console.error("Failed to auto-create task for order:", taskErr.message);
      }

      // Notify SuperAdmins and Managers about the new order
      try {
        const managers = await User.find({
          role: { $in: ["SuperAdmin", "Manager"] },
          isActive: true,
        }).select("_id").lean();
        const managerIds = managers.map((m) => m._id);
        if (managerIds.length > 0) {
          await createNotifications(managerIds, {
            title: `New Order: ${order.orderNumber}`,
            message: `A new order has been placed. Total: ${order.total || 0}`,
            type: "order_new",
            relatedModel: "Order",
            relatedId: order._id,
            link: "/manage/orders",
          });
        }
      } catch (notifErr) {
        console.error("Failed to create order notifications:", notifErr.message);
      }

      return res.status(201).json(order);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}

export default withRBACAuth(["SuperAdmin", "Manager"])(handler);
