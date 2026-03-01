import mongoose from "mongoose";

const TaskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    status: {
      type: String,
      enum: ["Pending", "In Progress", "Completed", "Overdue"],
      default: "Pending",
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Urgent"],
      default: "Medium",
    },
    category: {
      type: String,
      enum: [
        "Feeding",
        "Treatment",
        "Cleaning",
        "Breeding",
        "Vaccination",
        "Maintenance",
        "Inventory",
        "General",
        "Other",
      ],
      default: "General",
    },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    location: { type: mongoose.Schema.Types.ObjectId, ref: "Location", default: null },
    animal: { type: mongoose.Schema.Types.ObjectId, ref: "Animal", default: null },
    dueDate: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    completedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    notes: { type: String, default: "" },
    isRecurring: { type: Boolean, default: false },
    recurringInterval: {
      type: String,
      enum: ["Daily", "Weekly", "Biweekly", "Monthly", ""],
      default: "",
    },
  },
  { timestamps: true }
);

TaskSchema.index({ status: 1, dueDate: 1 });
TaskSchema.index({ assignedTo: 1, status: 1 });
TaskSchema.index({ category: 1 });

export default mongoose.models.Task || mongoose.model("Task", TaskSchema);
