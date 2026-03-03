import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    message: { type: String, default: "" },
    type: {
      type: String,
      enum: ["task_assigned", "task_reminder", "order_new", "system", "alert"],
      default: "system",
    },
    relatedModel: {
      type: String,
      enum: ["Task", "Order", "Animal", ""],
      default: "",
    },
    relatedId: { type: mongoose.Schema.Types.ObjectId, default: null },
    isRead: { type: Boolean, default: false },
    link: { type: String, default: "" },
  },
  { timestamps: true }
);

NotificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });
NotificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 }); // Auto-delete after 30 days

export default mongoose.models.Notification || mongoose.model("Notification", NotificationSchema);
