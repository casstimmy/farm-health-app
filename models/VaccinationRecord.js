import mongoose from "mongoose";

const VaccinationRecordSchema = new mongoose.Schema(
  {
    animal: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Animal",
      required: true,
      index: true,
    },
    vaccineName: { type: String, required: true },
    dosage: String,
    method: String,
    vaccinationDate: { type: Date, required: true, index: true },
    administeredBy: String,
    nextDueDate: Date,
    notes: String,
  },
  { timestamps: true }
);

// Compound index for animal vaccination history
VaccinationRecordSchema.index({ animal: 1, vaccinationDate: -1 });

export default mongoose.models.VaccinationRecord ||
  mongoose.model("VaccinationRecord", VaccinationRecordSchema);
