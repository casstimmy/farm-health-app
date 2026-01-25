import mongoose from "mongoose";

const InventorySchema = new mongoose.Schema({
  item: String,
  quantity: Number,
  category: String,
  dateAdded: Date
}, { timestamps: true });

export default mongoose.models.Inventory || mongoose.model("Inventory", InventorySchema);
