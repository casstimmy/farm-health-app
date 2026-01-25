import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true, required: true },
  password: String,
  pin: String,
  role: { type: String, enum: ["SuperAdmin", "Manager", "Attendant"], default: "Attendant" }
}, { timestamps: true });

export default mongoose.models.User || mongoose.model("User", UserSchema);
