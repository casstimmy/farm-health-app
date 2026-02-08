import mongoose from "mongoose";

const MedicationLookupSchema = new mongoose.Schema(
  {
    type: { type: String, required: true, trim: true },
    value: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

MedicationLookupSchema.index({ type: 1, value: 1 }, { unique: true });

export default mongoose.models.MedicationLookup ||
  mongoose.model("MedicationLookup", MedicationLookupSchema);
