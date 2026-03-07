import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

// 1. Connect to MongoDB Cloud Database
const MONGODB_URI = process.env.MONGODB_URI || "";
if (MONGODB_URI) {
  mongoose.connect(MONGODB_URI)
    .then(() => console.log("Successfully connected to MongoDB!"))
    .catch(err => console.error("MongoDB connection error:", err));
}

// 2. Define the MongoDB Blueprints
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
const app = express();
app.use(express.json({ limit: '10mb' }));

const formatDoc = (doc: any) => ({ ...doc.toObject(), id: doc._id });

// --- API Routes ---

app.get("/api/clients", async (req, res) => {
  const clients = await Client.find().sort({ clientName: 1 });
  res.json(clients.map(formatDoc));
});

app.post("/api/clients", async (req, res) => {
  const newClient = await Client.create(req.body);
  res.json({ id: newClient._id });
});

app.get("/api/orders", async (req, res) => {
  const orders = await Order.find().populate('clientId').sort({ orderDate: -1, _id: -1 });
  const formattedOrders = orders.map(o => {
    const orderObj = formatDoc(o);
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

app.get("/api/profile", async (req, res) => {
  let profile = await Profile.findOne();
  if (!profile) {
    profile = await Profile.create({
      companyName: 'MS Delivery Services',
      ownerName: 'Admin',
      contactEmail: 'admin@msdelivery.com'
    });
  }
  res.json(formatDoc(profile));
});

// Export the app for Vercel Serverless Functions
export default app;
