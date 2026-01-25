import dbConnect from "@/lib/mongodb";
import Finance from "@/models/Finance";
import { withRBACAuth } from "@/utils/middleware";
import mongoose from "mongoose";

async function handler(req, res) {
  await dbConnect();
  const { id } = req.query;

  // Validate MongoDB ID
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid ID format" });
  }

  if (req.method === "GET") {
    try {
      const finance = await Finance.findById(id);
      if (!finance) {
        return res.status(404).json({ error: "Record not found" });
      }
      res.status(200).json(finance);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === "PUT") {
    try {
      const financeData = req.body;
      const updatedRecord = await Finance.findByIdAndUpdate(
        id,
        {
          title: financeData.title || undefined,
          description: financeData.description || undefined,
          category: financeData.category || undefined,
          amount: financeData.amount || undefined,
          type: financeData.type || undefined,
          paymentMethod: financeData.paymentMethod || undefined,
          vendor: financeData.vendor || undefined,
          invoiceNumber: financeData.invoiceNumber || undefined,
          status: financeData.status || undefined,
          notes: financeData.notes || undefined,
          date: financeData.date || undefined
        },
        { new: true, runValidators: true }
      );

      if (!updatedRecord) {
        return res.status(404).json({ error: "Record not found" });
      }

      res.status(200).json(updatedRecord);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === "DELETE") {
    try {
      const deletedRecord = await Finance.findByIdAndDelete(id);
      if (!deletedRecord) {
        return res.status(404).json({ error: "Record not found" });
      }
      res.status(200).json({ message: "Record deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}

export default withRBACAuth(["SuperAdmin", "Manager"])(handler);
