import mongoose from "mongoose";

const FeedingRecordSchema = new mongoose.Schema(
  {
    animal: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Animal",
      required: true,
      index: true,
    },
    feedType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FeedType",
      default: null,
    },
    feedTypeName: String, // Denormalized for display
    inventoryItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Inventory",
      default: null,
    },
    quantityOffered: { type: Number, default: 0 },
    quantityConsumed: { type: Number, default: 0 },
    unitCost: { type: Number, default: 0 },
    totalCost: { type: Number, default: 0 },
    date: { type: Date, required: true, index: true },
    feedingMethod: String,
    notes: String,
  },
  { timestamps: true }
);

// Compound index for animal feed history queries
FeedingRecordSchema.index({ animal: 1, date: -1 });

// Post-save hook: deduct inventory, update animal totalFeedCost
FeedingRecordSchema.post("save", async function (doc) {
  try {
    if (doc.inventoryItem && doc.quantityConsumed > 0) {
      const Inventory = mongoose.model("Inventory");
      await Inventory.findByIdAndUpdate(doc.inventoryItem, {
        $inc: { quantity: -doc.quantityConsumed, totalConsumed: doc.quantityConsumed },
      });
    }
    if (doc.totalCost > 0) {
      const Animal = mongoose.model("Animal");
      await Animal.findByIdAndUpdate(doc.animal, {
        $inc: { totalFeedCost: doc.totalCost },
      });
    }
  } catch (err) {
    console.error("FeedingRecord post-save hook error:", err);
  }
});

export default mongoose.models.FeedingRecord ||
  mongoose.model("FeedingRecord", FeedingRecordSchema);
