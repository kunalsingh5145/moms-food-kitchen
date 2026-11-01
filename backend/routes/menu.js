import { Router } from "express";
import MenuDay from "../models/MenuDay.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = Router();
const days = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];

router.get("/", async (req, res) => {
  const menus = await MenuDay.find({}).sort({ _id: 1 });
  res.json({ menus });
});

router.put("/:day", requireAuth, requireAdmin, async (req, res) => {
  try {
    const day = days.find(d => d.toLowerCase() === req.params.day.toLowerCase());
    if (!day) return res.status(400).json({ message: "Invalid weekday." });
    const { items, prices, availableTiffins, active } = req.body;
    if (!Number.isInteger(Number(availableTiffins)) || Number(availableTiffins) < 0)
      return res.status(400).json({ message: "Availability must be a whole number of 0 or more." });
    const safePrices = {};
    for (const key of ["chapati","rice","dal","sabzi"]) {
      const n = Number(prices?.[key]);
      if (!Number.isFinite(n) || n < 0) return res.status(400).json({ message: `Invalid ${key} price.` });
      safePrices[key] = n;
    }
    const menu = await MenuDay.findOneAndUpdate({ day }, {
      $set: { items: { ...items }, prices: safePrices, availableTiffins: Number(availableTiffins), active: Boolean(active) }
    }, { new: true, upsert: true, runValidators: true });
    res.json({ menu });
  } catch { res.status(400).json({ message: "Could not save menu." }); }
});

export default router;
