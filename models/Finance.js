import mongoose from "mongoose";

const FinanceSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    default: () => new Date()
  },
  month: String,
  title: {
    type: String,
    required: true
  },
  description: String,
  category: {
    type: String,
    required: true,
    enum: [
      "Feed",
      "Medication",
      "Transport",
      "Utilities",
      "Equipment",
      "Labor",
      "Admin",
      "Maintenance",
      "Petty Cash",
      "Other",
      "Sales"
    ]
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  type: {
    type: String,
    enum: ["income", "expense"],
    default: "expense"
  },
  paymentMethod: {
    type: String,
    enum: ["Cash", "Bank Transfer", "Check", "Mobile Money"],
    default: "Cash"
  },
  vendor: String,
  invoiceNumber: String,
  status: {
    type: String,
    enum: ["Pending", "Completed"],
    default: "Completed"
  },
  recordedBy: String,
  notes: String
}, { timestamps: true });

export default mongoose.models.Finance || mongoose.model("Finance", FinanceSchema);
