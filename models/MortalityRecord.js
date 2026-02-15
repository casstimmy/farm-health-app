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

// Post-save hook: set animal status to "Dead" & create Finance loss record
MortalityRecordSchema.post("save", async function (doc) {
  try {
    const Animal = mongoose.model("Animal");
    await Animal.findByIdAndUpdate(doc.animal, { status: "Dead" });

    // Create a financial loss record for the mortality
    if (doc.estimatedValue > 0) {
      const Finance = mongoose.model("Finance");
      await Finance.create({
        date: doc.dateOfDeath || new Date(),
        type: "Expense",
        category: "Mortality Loss",
        title: `Mortality Loss - Animal Death`,
        description: doc.cause
          ? `Cause: ${doc.cause}. ${doc.notes || ""}`
          : doc.notes || "Animal mortality loss",
        amount: doc.estimatedValue,
        relatedAnimal: doc.animal,
        recordedBy: doc.reportedBy || "System",
        status: "Completed",
      });
    }
  } catch (err) {
    console.error("MortalityRecord post-save hook error:", err);
  }
});

export default mongoose.models.MortalityRecord ||
  mongoose.model("MortalityRecord", MortalityRecordSchema);
