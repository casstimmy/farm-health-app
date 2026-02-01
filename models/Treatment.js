import mongoose from "mongoose";

const TreatmentSchema = new mongoose.Schema({
  date: Date,
  animalId: String,
  breed: String,
  gender: String,
  routine: String,
  symptoms: String,
  possibleCause: String,
  diagnosis: String,
  prescribedDays: String,
  type: String,
  preWeight: String,
  medication: String,
  dosage: String,
  route: String,
  treatedBy: String,
  postObservation: String,
  observationTime: String,
  completionDate: Date,
  recoveryStatus: String,
  postWeight: String,
  notes: String
}, { timestamps: true });

export default mongoose.models.Treatment || mongoose.model("Treatment", TreatmentSchema);
