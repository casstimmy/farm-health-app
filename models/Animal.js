import mongoose from "mongoose";

const TreatmentSchema = new mongoose.Schema({
  date: Date,
  symptoms: String,
  possibleCause: String,
  diagnosis: String,
  treatmentType: String,
  medication: {
    name: String,
    dosage: String,
    route: String
  },
  treatedBy: String,
  postTreatmentObservation: String,
  treatmentCompletionDate: Date,
  recoveryStatus: String
});

const FeedingSchema = new mongoose.Schema({
  date: Date,
  feedCategory: String,
  quantityOffered: Number,
  quantityConsumed: Number,
  feedingMethod: String,
  notes: String
});

const WeightSchema = new mongoose.Schema({
  date: Date,
  weightKg: Number,
  recordedBy: String,
  notes: String
});

const VaccinationSchema = new mongoose.Schema({
  vaccineName: String,
  method: String,
  dosage: String,
  vaccinationDate: Date
});

const AnimalSchema = new mongoose.Schema({
  tagId: { type: String, required: true, unique: true },
  myNotes: String,
  name: String,
  species: String,
  breed: String,
  origin: String,
  class: String,
  gender: String,
  dob: Date,
  color: String,
  acquisitionType: String,
  acquisitionDate: Date,
  sireId: String,
  damId: String,
  status: { type: String, default: "Alive" },
  location: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Location",
    required: false,
  },
  paddock: String,
  weight: { type: Number, default: 0 },
  weightDate: Date,
  recordedBy: String,
  images: [
    {
      full: { type: String, required: true },
      thumb: { type: String, required: true },
      uploadedAt: { type: Date, default: Date.now }
    }
  ],
  treatmentHistory: [TreatmentSchema],
  feedingHistory: [FeedingSchema],
  weightHistory: [WeightSchema],
  vaccinationRecords: [VaccinationSchema],
  notes: String
}, { timestamps: true });

export default mongoose.models.Animal || mongoose.model("Animal", AnimalSchema);
