import mongoose from "mongoose";

const FeedItemSchema = new mongoose.Schema(
  {
    feedTypeName: String,
    inventoryItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Inventory",
      default: null,
    },
    quantityOffered: { type: Number, default: 0 },
    quantityConsumed: { type: Number, default: 0 },
    unitCost: { type: Number, default: 0 },
    totalCost: { type: Number, default: 0 },
  },
  { _id: false }
);

const FeedingRecordSchema = new mongoose.Schema(
  {
    animal: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Animal",
      required: true,
      index: true,
    },
    feedItems: [FeedItemSchema], // Array of feed items
    date: { type: Date, required: true, index: true },
    feedingMethod: String,
    location: { type: mongoose.Schema.Types.ObjectId, ref: "Location", default: null },
    notes: String,
    // Denormalized totals for quick access
    totalQuantityOffered: { type: Number, default: 0 },
    totalQuantityConsumed: { type: Number, default: 0 },
    totalFeedCost: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Compound index for animal feed history queries
FeedingRecordSchema.index({ animal: 1, date: -1 });

// Post-save hook: deduct inventory, update animal totalFeedCost
FeedingRecordSchema.post("save", async function (doc) {
  try {
    if (doc.feedItems && doc.feedItems.length > 0) {
      const Inventory = mongoose.model("Inventory");
      const Animal = mongoose.model("Animal");
      
      // Deduct inventory for each feed item
      for (const item of doc.feedItems) {
        if (item.inventoryItem && item.quantityConsumed > 0) {
          await Inventory.findByIdAndUpdate(item.inventoryItem, {
            $inc: { quantity: -item.quantityConsumed, totalConsumed: item.quantityConsumed },
          });
        }
      }
      
      // Update animal totalFeedCost
      if (doc.totalFeedCost > 0) {
        await Animal.findByIdAndUpdate(doc.animal, {
          $inc: { totalFeedCost: doc.totalFeedCost },
        });
      }
    }
  } catch (err) {
    console.error("FeedingRecord post-save hook error:", err);
  }
});

export default mongoose.models.FeedingRecord ||
  mongoose.model("FeedingRecord", FeedingRecordSchema);
