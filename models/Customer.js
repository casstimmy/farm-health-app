import mongoose from "mongoose";

const CustomerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, index: true },
    phone: { type: String, default: "", trim: true, index: true },
    email: { type: String, default: "", trim: true, lowercase: true, index: true },
    address: { type: String, default: "" },
    location: { type: mongoose.Schema.Types.ObjectId, ref: "Location", default: null, index: true },
    isActive: { type: Boolean, default: true, index: true },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

CustomerSchema.index({ isActive: 1, createdAt: -1 });

export default mongoose.models.Customer || mongoose.model("Customer", CustomerSchema);
