import dbConnect from "@/lib/mongodb";
import Treatment from "@/models/Treatment";
import { withAuth } from "@/utils/middleware";

async function handler(req, res) {
  await dbConnect();

  const {
    query: { id },
    method,
  } = req;

  if (method === "DELETE") {
    try {
      const deleted = await Treatment.findByIdAndDelete(id);
      if (!deleted) {
        return res.status(404).json({ error: "Treatment not found" });
      }
      res.status(200).json({ message: "Treatment deleted" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else if (method === "PUT") {
    try {
      const updated = await Treatment.findByIdAndUpdate(id, req.body, { new: true });
      if (!updated) {
        return res.status(404).json({ error: "Treatment not found" });
      }
      res.status(200).json(updated);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}

export default withAuth(handler);
