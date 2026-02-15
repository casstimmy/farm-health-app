import mongoose from "mongoose";

const InventoryLossSchema = new mongoose.Schema(
  {
    inventoryItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Inventory",
      required: true,
      index: true,
    },
    itemName: String, // Denormalized for display
    type: {
      type: String,
      enum: ["Wasted", "Damaged", "Lost", "Expired"],
      required: true,
      index: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    unitCost: { type: Number, default: 0 },
    totalLoss: { type: Number, default: 0 },
    date: {
      type: Date,
      required: true,
      default: () => new Date(),
      index: true,
    },
    reason: String,
    reportedBy: String,
    notes: String,
  },
  { timestamps: true }
);

// Compound indexes
InventoryLossSchema.index({ inventoryItem: 1, date: -1 });
InventoryLossSchema.index({ type: 1, date: -1 });

// Post-save hook: deduct from inventory and create Finance expense
InventoryLossSchema.post("save", async function (doc) {
  try {
    // Deduct quantity from inventory
    const Inventory = mongoose.model("Inventory");
    await Inventory.findByIdAndUpdate(doc.inventoryItem, {
      $inc: { quantity: -doc.quantity },
    });

    // Create financial loss record
    if (doc.totalLoss > 0) {
      const Finance = mongoose.model("Finance");
      await Finance.create({
        date: doc.date,
        type: "Expense",
        category: "Inventory Loss",
        title: `${doc.type} - ${doc.itemName || "Inventory Item"}`,
        description: doc.reason || `${doc.type} inventory loss`,
        amount: doc.totalLoss,
        relatedInventory: doc.inventoryItem,
        recordedBy: doc.reportedBy || "System",
        status: "Completed",
      });
    }
  } catch (err) {
    console.error("InventoryLoss post-save hook error:", err);
  }
});

export default mongoose.models.InventoryLoss ||
  mongoose.model("InventoryLoss", InventoryLossSchema);
