import mongoose from "mongoose";

const OrderItemSchema = new mongoose.Schema(
  {
    description: { type: String, required: true, trim: true },
    quantity: { type: Number, default: 1, min: 0 },
    unitPrice: { type: Number, default: 0, min: 0 },
    total: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

const OrderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true, trim: true, index: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", default: null, index: true },
    location: { type: mongoose.Schema.Types.ObjectId, ref: "Location", default: null, index: true },
    orderDate: { type: Date, default: () => new Date(), index: true },
    dueDate: { type: Date, default: null },
    status: {
      type: String,
      enum: ["Pending", "Confirmed", "Processing", "Completed", "Cancelled"],
      default: "Pending",
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ["Unpaid", "Partially Paid", "Paid", "Refunded"],
      default: "Unpaid",
      index: true,
    },
    items: { type: [OrderItemSchema], default: [] },
    subtotal: { type: Number, default: 0, min: 0 },
    total: { type: Number, default: 0, min: 0 },
    amountPaid: { type: Number, default: 0, min: 0 },
    balance: { type: Number, default: 0 },
    recordedBy: { type: String, default: "" },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

OrderSchema.index({ status: 1, orderDate: -1 });
OrderSchema.index({ paymentStatus: 1, orderDate: -1 });

OrderSchema.pre("validate", function (next) {
  const items = Array.isArray(this.items) ? this.items : [];
  let subtotal = 0;

  this.items = items.map((item) => {
    const quantity = Number(item.quantity || 0);
    const unitPrice = Number(item.unitPrice || 0);
    const total = Number((quantity * unitPrice).toFixed(2));
    subtotal += total;
    return {
      description: item.description,
      quantity,
      unitPrice,
      total,
    };
  });

  this.subtotal = Number(subtotal.toFixed(2));
  this.total = Number((this.total || this.subtotal).toFixed(2));
  this.balance = Number((this.total - Number(this.amountPaid || 0)).toFixed(2));
  next();
});

export default mongoose.models.Order || mongoose.model("Order", OrderSchema);
