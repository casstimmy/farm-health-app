import mongoose from "mongoose";

const AnimalSchema = new mongoose.Schema(
  {
    tagId: { type: String, required: true, unique: true, index: true },
    name: String,
    species: { type: String, index: true },
    breed: String,
    class: String,
    gender: {
      type: String,
      enum: ["Male", "Female"],
    },
    dob: Date,
    color: String,
    origin: String,
    acquisitionType: {
      type: String,
      enum: ["Bred on farm", "Purchased", "Donated", "Other"],
    },
    acquisitionDate: Date,
    sire: { type: mongoose.Schema.Types.ObjectId, ref: "Animal", default: null },
    dam: { type: mongoose.Schema.Types.ObjectId, ref: "Animal", default: null },
    status: {
      type: String,
      enum: ["Alive", "Dead", "Sold", "Quarantined"],
      default: "Alive",
      index: true,
    },
    location: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Location",
      default: null,
    },
    paddock: String,
    currentWeight: { type: Number, default: 0 },
    weightDate: Date,
    recordedBy: String,
    images: [
      {
        full: { type: String, required: true },
        thumb: { type: String, required: true },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    notes: String,
  },
  { timestamps: true }
);

// Compound indexes for common queries
AnimalSchema.index({ species: 1, status: 1 });
AnimalSchema.index({ location: 1 });

export default mongoose.models.Animal || mongoose.model("Animal", AnimalSchema);
