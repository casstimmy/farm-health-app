import dbConnect from "@/lib/mongodb";
import Finance from "@/models/Finance";
import { withRBACAuth } from "@/utils/middleware";

async function handler(req, res) {
  await dbConnect();

  if (req.method === "GET") {
    try {
      const { type } = req.query;
      // Support both old lowercase and new capitalized type values
      let query = {};
      if (type) {
        const normalizedType =
          type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
        query.type = normalizedType;
      }
      const finances = await Finance.find(query).sort({ date: -1 });
      res.status(200).json(finances);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === "POST") {
    try {
      const financeData = req.body;

      // Normalize type to capitalized format
      let finType = financeData.type || "Expense";
      finType = finType.charAt(0).toUpperCase() + finType.slice(1).toLowerCase();

      const newRecord = new Finance({
        date: financeData.date || new Date(),
        title: financeData.title,
        description: financeData.description || "",
        category: financeData.category,
        amount: financeData.amount,
        type: finType,
        paymentMethod: financeData.paymentMethod || "Cash",
        vendor: financeData.vendor || "",
        invoiceNumber: financeData.invoiceNumber || "",
        status: financeData.status || "Completed",
        relatedAnimal: financeData.relatedAnimal || undefined,
        relatedInventory: financeData.relatedInventory || undefined,
        recordedBy: financeData.recordedBy || "System",
        notes: financeData.notes || "",
      });

      await newRecord.save();
      res.status(201).json(newRecord);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}

export default withRBACAuth(["SuperAdmin", "Manager"])(handler);
