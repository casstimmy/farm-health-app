import mongoose from "mongoose";

const FeedTypeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    category: String,
    purpose: String,
    method: String,
    description: String,
  },
  { timestamps: true }
);

export default mongoose.models.FeedType ||
  mongoose.model("FeedType", FeedTypeSchema);
