import mongoose from "mongoose";

const MedicationSchema = new mongoose.Schema({
  name: String,
  details: String,
  expiration: Date,
  classCategory: String,
  purpose: String,
  recommendedDosage: String,
  route: String,
  supplier: String,
  inventoryItem: { type: mongoose.Schema.Types.ObjectId, ref: "Inventory" }
}, { timestamps: true });

export default mongoose.models.Medication || mongoose.model("Medication", MedicationSchema);
