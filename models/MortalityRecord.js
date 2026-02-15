import mongoose from "mongoose";

const MortalityRecordSchema = new mongoose.Schema(
  {
    animal: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Animal",
      required: true,
      index: true,
    },
    dateOfDeath: { type: Date, required: true, index: true },
    cause: String,
    symptoms: String,
    daysSick: { type: Number, default: 0 },
    weight: { type: Number, default: null },
    estimatedValue: { type: Number, default: 0 },
    disposalMethod: {
      type: String,
      enum: ["Burial", "Incinerated", "Autopsy/Dispose", "Composting", "Other", ""],
    },
    valueLost: { type: Number, default: 0 },
    reportedBy: String,
    location: { type: mongoose.Schema.Types.ObjectId, ref: "Location", default: null },
    notes: String,
  },
  { timestamps: true }
);

// Post-save hook: set animal status to "Dead" & create Finance loss record
MortalityRecordSchema.post("save", async function (doc) {
  try {
    const Animal = mongoose.model("Animal");
    const animal = await Animal.findById(doc.animal);
    
    // Set animal status to Dead
    if (animal) {
      await Animal.findByIdAndUpdate(doc.animal, { status: "Dead" });
    }

    // Calculate valueLost from animal data if estimatedValue not set
    let lossAmount = doc.estimatedValue || 0;
    if (!lossAmount && animal) {
      // Use projectedSalesPrice or purchaseCost + feed + med costs
      lossAmount = animal.projectedSalesPrice || 
        (animal.purchaseCost + animal.totalFeedCost + animal.totalMedicationCost) || 0;
      // Update the record with calculated value
      if (lossAmount > 0) {
        await mongoose.model("MortalityRecord").findByIdAndUpdate(doc._id, { 
          estimatedValue: lossAmount,
          valueLost: lossAmount 
        });
      }
    } else {
      await mongoose.model("MortalityRecord").findByIdAndUpdate(doc._id, { 
        valueLost: lossAmount 
      });
    }

    // Create a financial loss record for the mortality
    if (lossAmount > 0) {
      const Finance = mongoose.model("Finance");
      await Finance.create({
        date: doc.dateOfDeath || new Date(),
        type: "Expense",
        category: "Mortality Loss",
        title: `Mortality Loss - ${animal?.tagId || 'Animal'} Death`,
        description: doc.cause
          ? `Cause: ${doc.cause}. ${doc.notes || ""}`
          : doc.notes || "Animal mortality loss",
        amount: lossAmount,
        relatedAnimal: doc.animal,
        recordedBy: doc.reportedBy || "System",
        status: "Completed",
      });
    }
  } catch (err) {
    console.error("MortalityRecord post-save hook error:", err);
  }
});

export default mongoose.models.MortalityRecord ||
  mongoose.model("MortalityRecord", MortalityRecordSchema);
