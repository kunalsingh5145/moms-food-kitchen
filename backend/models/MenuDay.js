import mongoose from "mongoose";

const menuDaySchema = new mongoose.Schema({
  day: { type: String, required: true, unique: true, enum: ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"] },
  items: {
    chapati: { type: String, default: "Chapati" },
    rice: { type: String, default: "Rice" },
    dal: { type: String, default: "Dal" },
    sabzi: { type: String, default: "Seasonal Sabzi" },
    description: { type: String, default: "" }
  },
  prices: {
    chapati: { type: Number, default: 5, min: 0 },
    rice: { type: Number, default: 20, min: 0 },
    dal: { type: Number, default: 20, min: 0 },
    sabzi: { type: Number, default: 20, min: 0 }
  },
  availableTiffins: { type: Number, default: 30, min: 0 },
  active: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model("MenuDay", menuDaySchema);
