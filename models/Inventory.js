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
    item: { type: String, required: true },
    quantity: { type: Number, required: true, default: 0 },
    unit: { type: String, default: "Unit" },
    category: String,
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InventoryCategory",
      default: null,
    },
    categoryName: String,
    price: { type: Number, default: 0 },
    minStock: { type: Number, default: 0 },
    expiration: Date,
    supplier: String,
    medication: MedicationDetailsSchema,
    dateAdded: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Indexes
InventorySchema.index({ categoryId: 1 });
InventorySchema.index({ item: 1 });

export default mongoose.models.Inventory ||
  mongoose.model("Inventory", InventorySchema);
