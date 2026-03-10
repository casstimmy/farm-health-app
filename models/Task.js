import mongoose from "mongoose";

const TaskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    
    // Task classification
    taskGroup: { type: String, default: null },
    isRoutine: { type: Boolean, default: false },
    frequency: { type: String, default: null },
    
    // Status & Priority
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
    
    // Category - expanded to support farm-specific categories
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
        "Operations",
        "Sanitation",
        "Healthcare",
        "Parasite Treatment",
        "Bookkeeping",
        "Pasture Mgt",
      ],
      default: "General",
    },
    
    // Assignment & tracking
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    assignedRole: { type: String, default: null }, // Original role, e.g., "Farm Manager"
    location: { type: mongoose.Schema.Types.ObjectId, ref: "Location", default: null },
    paddock: { type: String, default: "" },
    animal: { type: mongoose.Schema.Types.ObjectId, ref: "Animal", default: null },
    
    // Dates & Reminders
    dueDate: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    completedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    
    // Notes
    notes: { type: String, default: "" },
    
    // Recurring task support
    isRecurring: { type: Boolean, default: false },
    recurringInterval: {
      type: String,
      enum: ["Daily", "Weekly", "Biweekly", "Monthly", "Bi-Monthly", "Quarterly", "Yearly", ""],
      default: "",
    },
    
    // Reminders
    reminderDaysBefore: { type: Number, default: 0 },
    reminderFormat: { type: String, default: null }, // e.g., "1 week", "1 month"
    reminderSentAt: { type: Date, default: null },
  },
  { timestamps: true }
);

TaskSchema.index({ status: 1, dueDate: 1 });
TaskSchema.index({ assignedTo: 1, status: 1 });
TaskSchema.index({ category: 1 });

export default mongoose.models.Task || mongoose.model("Task", TaskSchema);
