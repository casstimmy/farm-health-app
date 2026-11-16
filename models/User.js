import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, unique: true, required: true, trim: true },
  // Stored as a bcrypt hash (see utils/pin.js). Never returned by default:
  // a query must ask for it explicitly with .select("+pin").
  pin: { type: String, required: true, select: false },
  role: {
    type: String,
    enum: ["SuperAdmin", "SubAdmin", "Manager", "Attendant"],
    default: "Attendant"
  },
  location: { type: mongoose.Schema.Types.ObjectId, ref: "Location", default: null },
  locations: [{ type: mongoose.Schema.Types.ObjectId, ref: "Location" }],
  isActive: { type: Boolean, default: true },
  // Wrong-PIN protection: after too many failures the account is locked for a while.
  failedLoginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date, default: null },
  lastLogin: { type: Date },
  avatar: { type: String, default: "" },
  phone: { type: String, default: "" }
}, { timestamps: true });

UserSchema.index({ location: 1 });

export default mongoose.models.User || mongoose.model("User", UserSchema);
