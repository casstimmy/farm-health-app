import mongoose from "mongoose";

const BreedingRecordSchema = new mongoose.Schema(
  {
    breedingId: { type: String, unique: true, required: true, index: true },
    species: String,
    doe: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Animal",
      required: true,
      index: true,
    },
    buck: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Animal",
      required: true,
    },
    matingDate: { type: Date, required: true },
    breedingType: {
      type: String,
      enum: ["Natural", "AI"],
      default: "Natural",
    },
    pregnancyCheckDate: Date,
    pregnancyStatus: {
      type: String,
      enum: ["Pending", "Confirmed", "Not Pregnant", "Delivered"],
      default: "Pending",
    },
    expectedDueDate: Date,
    actualKiddingDate: Date,
    kidsAlive: { type: Number, default: 0 },
    kidsDead: { type: Number, default: 0 },
    complications: String,
    notes: String,
  },
  { timestamps: true }
);

// Compound indexes
BreedingRecordSchema.index({ doe: 1, matingDate: -1 });
BreedingRecordSchema.index({ pregnancyStatus: 1 });

export default mongoose.models.BreedingRecord ||
  mongoose.model("BreedingRecord", BreedingRecordSchema);
