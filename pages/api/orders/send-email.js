import dbConnect from "@/lib/mongodb";
import Order from "@/models/Order";
import mongoose from "mongoose";
import { sendOrderStatusEmail } from "@/lib/mailer";
import { withRBACAuth } from "@/utils/middleware";

async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  await dbConnect();

  try {
    const { orderId, status, businessName = "Farm Manager", currency = "NGN" } = req.body;

    if (!orderId || !status) {
      return res.status(400).json({ error: "orderId and status are required" });
    }

    if (!["Confirmed", "Processing", "Completed"].includes(status)) {
      return res.status(400).json({ error: "Email is only sent for Confirmed, Processing, or Completed status" });
    }

    // Fetch the order
    const order = await mongoose.connection
      .collection("orders")
      .findOne({ _id: new mongoose.Types.ObjectId(orderId) });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Resolve customer email — customer may be ObjectId ref or inline data
    let customerEmail = "";
    let customerName = "Customer";

    if (order.customer) {
      const customerId = typeof order.customer === "string" ? order.customer : order.customer.toString();
      // Try customers collection first (new schema with firstName/lastName)
      const customer = await mongoose.connection
        .collection("customers")
        .findOne({ _id: new mongoose.Types.ObjectId(customerId) });

      if (customer) {
        customerEmail = customer.email || "";
        // Support both firstName/lastName and legacy name field
        if (customer.firstName || customer.lastName) {
          customerName = `${customer.firstName || ""} ${customer.lastName || ""}`.trim();
        } else if (customer.name) {
          customerName = customer.name;
        }
      }
    }

    // Fallback to inline fields on the order itself
    if (!customerEmail) {
      customerEmail = order.customerEmail || "";
    }
    if (customerName === "Customer") {
      customerName = order.customerName || "Customer";
    }

    if (!customerEmail) {
      return res.status(400).json({ error: "No email address found for this customer" });
    }

    const result = await sendOrderStatusEmail({
      to: customerEmail,
      customerName,
      orderNumber: order.orderNumber,
      status,
      items: order.items || [],
      total: Number(order.total || 0),
      currency,
      businessName,
      notes: order.notes || "",
    });

    return res.status(200).json({ message: "Email sent successfully", ...result });
  } catch (error) {
    console.error("Order email error:", error);
    return res.status(500).json({ error: error.message || "Failed to send email" });
  }
}

export default withRBACAuth(["SuperAdmin", "Manager"])(handler);
