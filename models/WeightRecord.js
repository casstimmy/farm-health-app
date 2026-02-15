import mongoose from "mongoose";

const WeightRecordSchema = new mongoose.Schema(
  {
    animal: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Animal",
      required: true,
      index: true,
    },
    weightKg: { type: Number, required: true },
    recordedBy: String,
    date: { type: Date, required: true, index: true },
    notes: String,
  },
  { timestamps: true }
);

// Compound index for animal weight history
WeightRecordSchema.index({ animal: 1, date: -1 });

// Post-save hook: update Animal.currentWeight
WeightRecordSchema.post("save", async function (doc) {
  try {
    const Animal = mongoose.model("Animal");
    await Animal.findByIdAndUpdate(doc.animal, {
      currentWeight: doc.weightKg,
      weightDate: doc.date,
      recordedBy: doc.recordedBy || undefined,
    });
  } catch (err) {
    console.error("Failed to update animal weight:", err);
  }
});

export default mongoose.models.WeightRecord ||
  mongoose.model("WeightRecord", WeightRecordSchema);
