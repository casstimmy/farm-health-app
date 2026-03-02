import mongoose from "mongoose";

const AddressSchema = new mongoose.Schema(
  {
    label: { type: String, default: "" },
    street: { type: String, default: "" },
    city: { type: String, default: "" },
    state: { type: String, default: "" },
    postalCode: { type: String, default: "" },
    country: { type: String, default: "" },
    isDefault: { type: Boolean, default: false },
  },
  { _id: true }
);

const CustomerSchema = new mongoose.Schema(
  {
    // Support both new (firstName/lastName) and legacy (name) fields
    firstName: { type: String, default: "", trim: true },
    lastName: { type: String, default: "", trim: true },
    name: { type: String, default: "", trim: true, index: true },
    phone: { type: String, default: "", trim: true, index: true },
    email: { type: String, default: "", trim: true, lowercase: true, index: true },
    password: { type: String, default: "" },
    addresses: { type: [AddressSchema], default: [] },
    // Legacy single address field
    address: { type: String, default: "" },
    location: { type: mongoose.Schema.Types.ObjectId, ref: "Location", default: null, index: true },
    isActive: { type: Boolean, default: true, index: true },
    isVerified: { type: Boolean, default: false },
    orderCount: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

CustomerSchema.index({ isActive: 1, createdAt: -1 });
CustomerSchema.index({ firstName: 1, lastName: 1 });

// Virtual to get display name regardless of schema version
CustomerSchema.virtual("displayName").get(function () {
  if (this.firstName || this.lastName) {
    return `${this.firstName || ""} ${this.lastName || ""}`.trim();
  }
  return this.name || "";
});

// Ensure virtuals are included in JSON and object output
CustomerSchema.set("toJSON", { virtuals: true });
CustomerSchema.set("toObject", { virtuals: true });

export default mongoose.models.Customer || mongoose.model("Customer", CustomerSchema);
