import dbConnect from "@/lib/mongodb";
import Finance from "@/models/Finance";
import { withAuth } from "@/utils/middleware";

/**
 * Expense API - accessible to ALL authenticated users
 * GET: List expenses (recent 50)
 * POST: Create new expense
 */
async function handler(req, res) {
  await dbConnect();

  if (req.method === "GET") {
    try {
      const expenses = await Finance.find({ type: "Expense" })
        .sort({ date: -1 })
        .limit(50)
        .populate("location")
        .lean();
      res.status(200).json(expenses);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === "POST") {
    try {
      const { title, amount, category, date, paymentMethod, description, notes, location } = req.body;

      if (!title || !amount || !category) {
        return res.status(400).json({ error: "Title, amount, and category are required" });
      }

      const expense = await Finance.create({
        title,
        amount: Number(amount),
        category,
        type: "Expense",
        date: date ? new Date(date) : new Date(),
        paymentMethod: paymentMethod || "Cash",
        description: description || "",
        notes: notes || "",
        location: location || null,
        recordedBy: req.user?.name || req.user?.email || "Staff",
        status: "Completed",
      });

      res.status(201).json(expense);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}

// withAuth allows ALL authenticated users (no role restriction)
export default withAuth(handler);
