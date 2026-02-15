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

// Post-save hook: optionally deduct inventory
TreatmentSchema.post("save", async function (doc) {
  if (doc.medication) {
    try {
      const Inventory = mongoose.model("Inventory");
      await Inventory.findByIdAndUpdate(doc.medication, {
        $inc: { quantity: -1 },
      });
    } catch (err) {
      console.error("Failed to deduct inventory after treatment:", err);
    }
  }
});

export default mongoose.models.Treatment ||
  mongoose.model("Treatment", TreatmentSchema);
