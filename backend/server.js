 import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import User from "./models/User.js";
import MenuDay from "./models/MenuDay.js";
import authRoutes from "./routes/auth.js";
import menuRoutes from "./routes/menu.js";
import orderRoutes from "./routes/orders.js";
import dns from "node:dns";

dns.setServers(["8.8.8.8", "8.8.4.4"]);
dotenv.config();
const app = express();
app.use(cors({ origin: process.env.CLIENT_ORIGIN || "http://localhost:5173" }));
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (req,res) => res.json({ status: "ok", service: "Mom's Food Kitchen API" }));
app.use("/api/auth", authRoutes);
app.use("/api/menu", menuRoutes);
app.use("/api/orders", orderRoutes);

async function seedData() {
  const email = process.env.ADMIN_EMAIL?.toLowerCase().trim();
  const password = process.env.ADMIN_PASSWORD;
  if (email && password && !(await User.findOne({ email }))) {
    await User.create({
      name: process.env.ADMIN_NAME || "Kitchen Admin",
      email, passwordHash: await bcrypt.hash(password, 12), role: "admin"
    });
    console.log("Admin account created from environment settings.");
  }
  const defaults = [
    ["Monday","Aloo Sabzi"],["Tuesday","Mix Veg"],["Wednesday","Paneer"],["Thursday","Bhindi"],
    ["Friday","Aloo Gobi"],["Saturday","Seasonal Sabzi"],["Sunday","Special Paneer Thali"]
  ];
  for (const [day,sabzi] of defaults) {
    await MenuDay.updateOne({ day }, { $setOnInsert: {
      day, items: { chapati:"Chapati", rice:"Rice", dal:"Dal", sabzi, description:"Fresh homemade meal" },
      prices: { chapati:5, rice:20, dal:20, sabzi:20 }, availableTiffins:30, active:true
    } }, { upsert:true });
  }
}

const port = process.env.PORT || 5000;
mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/moms_food_kitchen")
  .then(async () => {
    console.log("Connected to MongoDB.");
    await seedData();
    app.listen(port, () => console.log(`Mom's Food Kitchen API running on http://localhost:${port}`));
  })
  .catch(err => { console.error("MongoDB connection failed:", err.message); process.exit(1); });
