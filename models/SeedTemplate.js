import mongoose from "mongoose";

const SeedTemplateSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    columns: {
      type: [String],
      default: [],
    },
    rows: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.models.SeedTemplate || mongoose.model("SeedTemplate", SeedTemplateSchema);

