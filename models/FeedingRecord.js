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
    quantityOffered: { type: Number, default: 0 },
    quantityConsumed: { type: Number, default: 0 },
    date: { type: Date, required: true, index: true },
    feedingMethod: String,
    notes: String,
  },
  { timestamps: true }
);

// Compound index for animal feed history queries
FeedingRecordSchema.index({ animal: 1, date: -1 });

export default mongoose.models.FeedingRecord ||
  mongoose.model("FeedingRecord", FeedingRecordSchema);
