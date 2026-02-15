import mongoose from "mongoose";

const MortalityRecordSchema = new mongoose.Schema(
  {
    animal: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Animal",
      required: true,
      index: true,
    },
    dateOfDeath: { type: Date, required: true, index: true },
    cause: String,
    symptoms: String,
    daysSick: { type: Number, default: 0 },
    weight: { type: Number, default: null },
    estimatedValue: { type: Number, default: 0 },
    disposalMethod: String,
    reportedBy: String,
    notes: String,
  },
  { timestamps: true }
);

// Post-save hook: automatically set animal status to "Dead"
MortalityRecordSchema.post("save", async function (doc) {
  try {
    const Animal = mongoose.model("Animal");
    await Animal.findByIdAndUpdate(doc.animal, { status: "Dead" });
  } catch (err) {
    console.error("Failed to update animal status after mortality:", err);
  }
});

export default mongoose.models.MortalityRecord ||
  mongoose.model("MortalityRecord", MortalityRecordSchema);
