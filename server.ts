import express from "express";
import { createServer as createViteServer } from "vite";
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Load environment variables (like your MongoDB secret link)
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Connect to MongoDB Cloud Database
const MONGODB_URI = process.env.MONGODB_URI || "";
if (!MONGODB_URI) {
  console.warn("WARNING: MONGODB_URI is not defined in environment variables!");
} else {
  mongoose.connect(MONGODB_URI)
    .then(() => console.log("Successfully connected to MongoDB!"))
    .catch(err => console.error("MongoDB connection error:", err));
}

// 2. Define the MongoDB Blueprints (Schemas)
const clientSchema = new mongoose.Schema({
  clientName: { type: String, required: true },
  clientAddress: String,
  clientContact: String
});
const Client = mongoose.model("Client", clientSchema);

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, required: true, unique: true },
  orderDate: { type: String, required: true },
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
  pickupLocation: String,
  customerName: String,
  dropLocation: String,
  mapPinUrl: String,
  customerContact: String,
  outsourceName: String,
  outsourceCharges: { type: Number, default: 0 },
  modeOfPayment: String,
  deliveryCharges: { type: Number, default: 0 },
  units: { type: Number, default: 1 },
  remark: String
});
const Order = mongoose.model("Order", orderSchema);

const profileSchema = new mongoose.Schema({
  companyName: String,
  ownerName: String,
  contactEmail: String,
  logoUrl: String
});
const Profile = mongoose.model("Profile", profileSchema);

// 3. Initialize Server
async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  // Helper to convert MongoDB _id to standard id for your frontend
  const formatDoc = (doc: any) => ({ ...doc.toObject(), id: doc._id });

  // --- API Routes ---

  // Clients API
  app.get("/api/clients", async (req, res) => {
    const clients = await Client.find().sort({ clientName: 1 });
    res.json(clients.map(formatDoc));
  });

  app.post("/api/clients", async (req, res) => {
    const newClient = await Client.create(req.body);
    res.json({ id: newClient._id });
  });

  app.put("/api/clients/:id", async (req, res) => {
    await Client.findByIdAndUpdate(req.params.id, req.body);
    res.json({ success: true });
  });

  app.delete("/api/clients/:id", async (req, res) => {
    await Client.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  });

  app.post("/api/clients/bulk-delete", async (req, res) => {
    await Client.deleteMany({ _id: { $in: req.body.ids } });
    res.json({ success: true });
  });

  // Orders API
  app.get("/api/orders", async (req, res) => {
    const orders = await Order.find().populate('clientId').sort({ orderDate: -1, _id: -1 });
    const formattedOrders = orders.map(o => {
      const orderObj = formatDoc(o);
      // Flatten clientName just like the old SQLite JOIN did
      orderObj.clientName = o.clientId ? (o.clientId as any).clientName : null;
      orderObj.clientId = o.clientId ? (o.clientId as any)._id : null;
      return orderObj;
    });
    res.json(formattedOrders);
  });

  app.post("/api/orders", async (req, res) => {
    try {
      const newOrder = await Order.create(req.body);
      res.json({ id: newOrder._id });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.put("/api/orders/:id", async (req, res) => {
    await Order.findByIdAndUpdate(req.params.id, req.body);
    res.json({ success: true });
  });

  app.delete("/api/orders/:id", async (req, res) => {
    await Order.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  });

  app.post("/api/orders/bulk-delete", async (req, res) => {
    await Order.deleteMany({ _id: { $in: req.body.ids } });
    res.json({ success: true });
  });

  // Profile API
  app.get("/api/profile", async (req, res) => {
    let profile = await Profile.findOne();
    if (!profile) {
      // Create default profile if none exists
      profile = await Profile.create({
        companyName: 'MS Delivery Services',
        ownerName: 'Admin',
        contactEmail: 'admin@msdelivery.com'
      });
    }
    res.json(formatDoc(profile));
  });

  app.put("/api/profile", async (req, res) => {
    await Profile.findOneAndUpdate({}, req.body, { upsert: true });
    res.json({ success: true });
  });

  // --- Vite / Frontend Middleware ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
