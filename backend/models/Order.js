import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  customerName: { type: String, required: true },
  phone: { type: String, default: "" },
  address: { type: String, required: true },
  day: { type: String, required: true },
  deliveryDate: { type: String, required: true },
  quantities: {
    chapati: { type: Number, min: 0, default: 0 },
    rice: { type: Number, min: 0, default: 0 },
    dal: { type: Number, min: 0, default: 0 },
    sabzi: { type: Number, min: 0, default: 0 }
  },
  total: { type: Number, required: true, min: 0 },
  paymentMethod: { type: String, enum: ["UPI", "COD"], required: true },
  paymentStatus: { type: String, enum: ["Pending", "Paid", "Pay on delivery"], default: "Pending" },
  upiReference: { type: String, default: "" },
  status: { type: String, enum: ["Pending", "Approved", "Rejected", "Preparing", "Out for delivery", "Delivered"], default: "Pending" },
  adminNote: { type: String, default: "" },
  estimatedDelivery: { type: String, default: "" },
  stockDeducted: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model("Order", orderSchema);
