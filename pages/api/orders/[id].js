import dbConnect from "@/lib/mongodb";
import Order from "@/models/Order";
import mongoose from "mongoose";
import { withRBACAuth } from "@/utils/middleware";

async function handler(req, res) {
  await dbConnect();
  const { id } = req.query;

  if (req.method === "GET") {
    try {
      const order = await mongoose.connection
        .collection("orders")
        .findOne({ _id: new mongoose.Types.ObjectId(id) });
      if (!order) return res.status(404).json({ error: "Order not found" });
      return res.status(200).json(order);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method === "PUT") {
    try {
      const payload = req.body || {};
      const updateDoc = {
        ...payload,
        updatedAt: new Date(),
      };
      const result = await mongoose.connection.collection("orders").findOneAndUpdate(
        { _id: new mongoose.Types.ObjectId(id) },
        { $set: updateDoc },
        { returnDocument: "after" }
      );
      if (!result.value) return res.status(404).json({ error: "Order not found" });
      return res.status(200).json(result.value);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method === "DELETE") {
    try {
      const result = await mongoose.connection.collection("orders").deleteOne({
        _id: new mongoose.Types.ObjectId(id),
      });
      if (!result.deletedCount) return res.status(404).json({ error: "Order not found" });
      return res.status(200).json({ message: "Order deleted" });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}

export default withRBACAuth(["SuperAdmin", "Manager"])(handler);
