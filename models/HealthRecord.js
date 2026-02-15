import mongoose from "mongoose";

// Sub-schema for individual treatment/medication entries
const TreatmentEntrySchema = new mongoose.Schema({
  treatmentType: String, // e.g., Antibiotics, Ext-Parasite, Deworming, Vitamin Dosing, Hydration/Electrolyte, Vaccination, Int
  medication: { type: mongoose.Schema.Types.ObjectId, ref: "Inventory", default: null },
  medicationName: String,
  dosage: String, // e.g., "20ml", "2 Sprays"
  route: {
    type: String,
    enum: ["IM", "Oral", "Subcutaneous", "Spraying", "Backline", "Topical", "IV", "Other", ""],
  },
}, { _id: false });

const HealthRecordSchema = new mongoose.Schema(
  {
    animal: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Animal",
      required: true,
      index: true,
    },
    date: { type: Date, required: true, index: true },
    time: String, // e.g., "12:00 PM"
    // Animal info (denormalized for display)
    animalTagId: String,
    animalGender: String,
    animalBreed: String,
    animalAge: String,
    // Routine check
    isRoutine: { type: Boolean, default: false },
    // Diagnosis section
    symptoms: String,
    possibleCause: String,
    diagnosis: String,
    // Treatment section
    prescribedDays: { type: Number, default: 0 },
    duration: String, // e.g., "3 Days", "a week interval"
    preWeight: { type: Number, default: null },
    // Vaccines
    vaccines: String, // e.g., "OCDT", "PPR", "HSV"
    // Treatment A (primary)
    treatmentA: TreatmentEntrySchema,
    // Treatment B (secondary - optional)
    needsMultipleTreatments: { type: Boolean, default: false },
    treatmentB: TreatmentEntrySchema,
    // Post treatment
    treatedBy: String,
    postObservation: String,
    observationTime: String, // e.g., "3:00 PM"
    completionDate: Date,
    recoveryStatus: {
      type: String,
      enum: ["Under Treatment", "Improving", "Recovered", "Regressing", ""],
    },
    postWeight: { type: Number, default: null },
    // Location
    location: { type: mongoose.Schema.Types.ObjectId, ref: "Location", default: null },
    // Notes / Treatment Plan Summary
    notes: String,
  },
  { timestamps: true }
);

// Compound indexes
HealthRecordSchema.index({ animal: 1, date: -1 });
HealthRecordSchema.index({ recoveryStatus: 1 });

// Post-save hook: deduct inventory for medications used
HealthRecordSchema.post("save", async function (doc) {
  try {
    const Inventory = mongoose.model("Inventory");
    const Animal = mongoose.model("Animal");

    // Deduct Treatment A medication
    if (doc.treatmentA?.medication) {
      const qty = 1;
      await Inventory.findByIdAndUpdate(doc.treatmentA.medication, {
        $inc: { quantity: -qty, totalConsumed: qty },
      });
    }

    // Deduct Treatment B medication
    if (doc.needsMultipleTreatments && doc.treatmentB?.medication) {
      const qty = 1;
      await Inventory.findByIdAndUpdate(doc.treatmentB.medication, {
        $inc: { quantity: -qty, totalConsumed: qty },
      });
    }

    // Update animal weight if postWeight provided
    if (doc.postWeight && doc.postWeight > 0) {
      await Animal.findByIdAndUpdate(doc.animal, {
        currentWeight: doc.postWeight,
        weightDate: doc.date,
      });
    }
  } catch (err) {
    console.error("HealthRecord post-save hook error:", err);
  }
});

export default mongoose.models.HealthRecord ||
  mongoose.model("HealthRecord", HealthRecordSchema);
