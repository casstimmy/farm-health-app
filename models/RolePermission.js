import mongoose from "mongoose";

const PermissionEntrySchema = new mongoose.Schema({
  feature: { type: String, required: true },
  access: [{ type: String, enum: ["View", "Create", "Edit", "Delete", "Manage"] }],
}, { _id: false });

const RolePermissionSchema = new mongoose.Schema(
  {
    roleName: {
      type: String,
      required: true,
      unique: true,
      enum: ["SuperAdmin", "SubAdmin", "Manager", "Attendant"],
    },
    description: String,
    permissions: [PermissionEntrySchema],
  },
  { timestamps: true }
);

export default mongoose.models.RolePermission ||
  mongoose.model("RolePermission", RolePermissionSchema);
