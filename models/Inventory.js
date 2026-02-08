import mongoose from "mongoose";

const MedicationDetailsSchema = new mongoose.Schema(
  {
    details: String,
    expiration: Date,
    classCategory: String,
    purpose: String,
    recommendedDosage: String,
    route: String,
    supplier: String,
  },
  { _id: false }
);

const InventorySchema = new mongoose.Schema(
  {
    item: String,
    quantity: Number,
    category: String,
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "InventoryCategory" },
    categoryName: String,
    minStock: Number,
    price: Number,
    unit: String,
    medication: MedicationDetailsSchema,
    dateAdded: Date,
  },
  { timestamps: true }
);

export default mongoose.models.Inventory || mongoose.model("Inventory", InventorySchema);
