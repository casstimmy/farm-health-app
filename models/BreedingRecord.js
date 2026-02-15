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
    breedingCoordinator: String,
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
    location: { type: mongoose.Schema.Types.ObjectId, ref: "Location", default: null },
    notes: String,
  },
  { timestamps: true }
);

// Compound indexes
BreedingRecordSchema.index({ doe: 1, matingDate: -1 });
BreedingRecordSchema.index({ pregnancyStatus: 1 });

// Post-save hook: create Finance income record when delivery is successful
BreedingRecordSchema.post("save", async function (doc) {
  try {
    if (doc.pregnancyStatus === "Delivered" && doc.kidsAlive > 0) {
      const Finance = mongoose.model("Finance");
      // Check if a finance record already exists for this breeding event
      const existing = await Finance.findOne({
        category: "Breeding Income",
        title: { $regex: doc.breedingId },
      });
      if (!existing) {
        // Estimate value per kid (can be adjusted in the finance record later)
        const estimatedValuePerKid = 5000;
        await Finance.create({
          date: doc.actualKiddingDate || new Date(),
          type: "Income",
          category: "Breeding Income",
          title: `Breeding Success - ${doc.breedingId}`,
          description: `${doc.kidsAlive} kid(s) born alive from breeding ${doc.breedingId}. Species: ${doc.species || "N/A"}.`,
          amount: doc.kidsAlive * estimatedValuePerKid,
          relatedAnimal: doc.doe,
          recordedBy: "System",
          status: "Completed",
        });
      }
    }
  } catch (err) {
    console.error("BreedingRecord post-save hook error:", err);
  }
});

export default mongoose.models.BreedingRecord ||
  mongoose.model("BreedingRecord", BreedingRecordSchema);
