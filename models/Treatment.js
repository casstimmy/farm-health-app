import mongoose from "mongoose";

const TreatmentSchema = new mongoose.Schema(
  {
    animal: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Animal",
      required: true,
      index: true,
    },
    date: { type: Date, required: true, index: true },
    routine: String,
    symptoms: String,
    possibleCause: String,
    diagnosis: String,
    prescribedDays: { type: Number, default: 0 },
    preWeight: { type: Number, default: null },
    postWeight: { type: Number, default: null },
    medication: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Inventory",
      default: null,
    },
    medicationName: String, // Denormalized for display
    dosage: String,
    dosageQty: { type: Number, default: 1 },
    unitCost: { type: Number, default: 0 },
    totalCost: { type: Number, default: 0 },
    route: {
      type: String,
      enum: ["IM", "Oral", "Subcutaneous", "Spray", "Backline", "Other", ""],
    },
    treatedBy: String,
    postObservation: String,
    observationTime: String,
    completionDate: Date,
    recoveryStatus: {
      type: String,
      enum: [
        "Under Treatment",
        "Improving",
        "Recovered",
        "Regressing",
        "",
      ],
    },
    notes: String,
  },
  { timestamps: true }
);

// Compound indexes
TreatmentSchema.index({ animal: 1, date: -1 });
TreatmentSchema.index({ recoveryStatus: 1 });

// Post-save hook: deduct inventory by dosageQty, update animal totalMedicationCost
TreatmentSchema.post("save", async function (doc) {
  try {
    if (doc.medication) {
      const qty = doc.dosageQty || 1;
      const Inventory = mongoose.model("Inventory");
      await Inventory.findByIdAndUpdate(doc.medication, {
        $inc: { quantity: -qty, totalConsumed: qty },
      });
    }
    if (doc.totalCost > 0) {
      const Animal = mongoose.model("Animal");
      await Animal.findByIdAndUpdate(doc.animal, {
        $inc: { totalMedicationCost: doc.totalCost },
      });
    }
  } catch (err) {
    console.error("Treatment post-save hook error:", err);
  }
});

export default mongoose.models.Treatment ||
  mongoose.model("Treatment", TreatmentSchema);
