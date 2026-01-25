import mongoose from "mongoose";

const MedicationSchema = new mongoose.Schema({
  name: String,
  details: String,
  expiration: Date,
  category: String,
  purpose: String,
  recommendedDosage: String
}, { timestamps: true });

export default mongoose.models.Medication || mongoose.model("Medication", MedicationSchema);
