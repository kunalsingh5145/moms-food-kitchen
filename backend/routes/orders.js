import { Router } from "express";
import Order from "../models/Order.js";
import MenuDay from "../models/MenuDay.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = Router();
const keys = ["chapati","rice","dal","sabzi"];

router.post("/", requireAuth, async (req, res) => {
  try {
    const { day, deliveryDate, quantities, address, phone, paymentMethod, upiReference } = req.body;
    const menu = await MenuDay.findOne({ day, active: true });
    if (!menu) return res.status(400).json({ message: "The menu is not available for that day." });
    if (!address?.trim() || !deliveryDate) return res.status(400).json({ message: "Delivery date and address are required." });
    const clean = {};
    for (const key of keys) {
      const n = Number(quantities?.[key] || 0);
      if (!Number.isInteger(n) || n < 0 || n > 20) return res.status(400).json({ message: `Invalid ${key} quantity.` });
      clean[key] = n;
    }
    if (!keys.some(k => clean[k] > 0)) return res.status(400).json({ message: "Choose at least one food item." });
    if (!["UPI","COD"].includes(paymentMethod)) return res.status(400).json({ message: "Choose a valid payment method." });
    const total = keys.reduce((sum,k) => sum + clean[k] * menu.prices[k], 0);
    const order = await Order.create({
      customer: req.user.id, customerName: req.user.name, phone: phone || "", address: address.trim(),
      day, deliveryDate, quantities: clean, total, paymentMethod,
      paymentStatus: paymentMethod === "COD" ? "Pay on delivery" : "Pending",
      upiReference: paymentMethod === "UPI" ? (upiReference || "") : ""
    });
    res.status(201).json({ order, message: "Order submitted. It is waiting for admin approval." });
  } catch { res.status(500).json({ message: "Could not place order." }); }
});

router.get("/mine", requireAuth, async (req, res) => {
  const orders = await Order.find({ customer: req.user.id }).sort({ createdAt: -1 });
  res.json({ orders });
});

router.get("/admin/all", requireAuth, requireAdmin, async (req, res) => {
  const orders = await Order.find({}).populate("customer", "name email").sort({ createdAt: -1 });
  res.json({ orders });
});

router.patch("/:id/decision", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { decision, adminNote = "", estimatedDelivery = "" } = req.body;
    if (!["Approved","Rejected"].includes(decision)) return res.status(400).json({ message: "Decision must be Approved or Rejected." });
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found." });
    if (order.status !== "Pending") return res.status(409).json({ message: "Only pending orders can be approved or rejected." });
    if (decision === "Approved") {
      // Atomic decrement prevents two simultaneous approvals overselling the same day's stock.
      const menu = await MenuDay.findOneAndUpdate(
        { day: order.day, active: true, availableTiffins: { $gte: 1 } },
        { $inc: { availableTiffins: -1 } }, { new: true }
      );
      if (!menu) return res.status(409).json({ message: "No tiffins are available for this day." });
      order.stockDeducted = true;
    }
    order.status = decision;
    order.adminNote = adminNote;
    order.estimatedDelivery = estimatedDelivery;
    await order.save();
    res.json({ order, message: `Order ${decision.toLowerCase()}.` });
  } catch { res.status(500).json({ message: "Could not update order." }); }
});

router.patch("/:id/status", requireAuth, requireAdmin, async (req, res) => {
  const allowed = ["Preparing","Out for delivery","Delivered"];
  if (!allowed.includes(req.body.status)) return res.status(400).json({ message: "Invalid order status." });
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: "Order not found." });
  if (!["Approved","Preparing","Out for delivery"].includes(order.status))
    return res.status(409).json({ message: "Approve the order before updating delivery status." });
  order.status = req.body.status;
  if (typeof req.body.estimatedDelivery === "string") order.estimatedDelivery = req.body.estimatedDelivery;
  await order.save();
  res.json({ order });
});

export default router;
