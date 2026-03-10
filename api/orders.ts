// @ts-nocheck
import { VercelRequest, VercelResponse } from '@vercel/node';
import mongoose from 'mongoose';

// Grab the secure database link from your environment variables
const MONGODB_URI = process.env.MONGODB_URI || "";

// 1. Define what an "Order" looks like in the database
const orderSchema = new mongoose.Schema({
  orderNumber: String,
  orderDate: String,
  clientId: String,
  pickupLocation: String,
  customerName: String,
  dropLocation: String,
  mapPinUrl: String,
  customerContact: String,
  outsourceName: String,
  outsourceCharges: Number,
  modeOfPayment: String,
  deliveryCharges: Number,
  units: Number,
  remark: String,
  status: { type: String, default: 'Pending' }
}, { timestamps: true });

// 2. We also define the Client model here so we can look up the client's real name
const clientSchema = new mongoose.Schema({ name: String }, { strict: false });
const Client = mongoose.models.Client || mongoose.model('Client', clientSchema);
const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);

// 3. The serverless function that handles the data
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Connect to MongoDB
    if (mongoose.connection.readyState === 0) {
      if (!MONGODB_URI) throw new Error("Database URL is missing!");
      await mongoose.connect(MONGODB_URI);
    }

    // GET: Fetch all orders to display on the sidebar
    if (req.method === 'GET') {
      const orders = await Order.find({}).sort({ createdAt: -1 });
      
      const ordersWithClientNames = await Promise.all(orders.map(async (order) => {
        const client = await Client.findById(order.clientId).catch(() => null);
        return {
          ...order.toObject(),
          clientName: client ? client.name : 'Unknown Client'
        };
      }));

      return res.status(200).json(ordersWithClientNames);
    } 
    
    // POST: Save a brand new order from the form
    if (req.method === 'POST') {
      const newOrder = new Order(req.body);
      await newOrder.save();
      return res.status(201).json(newOrder);
    }

    // DELETE: Remove an order (or multiple orders)
    if (req.method === 'DELETE') {
      // Handle Single Deletion (Look for ID in the URL)
      const { id } = req.query;
      if (id) {
        const deletedOrder = await Order.findByIdAndDelete(id);
        if (!deletedOrder) {
          return res.status(404).json({ success: false, message: "Order not found" });
        }
        return res.status(200).json({ success: true, message: "Order deleted successfully" });
      }

      // Handle Bulk Deletion (Look for an array of IDs in the request body)
      const { ids } = req.body || {};
      if (ids && Array.isArray(ids)) {
        await Order.deleteMany({ _id: { $in: ids } });
        return res.status(200).json({ success: true, message: "Selected orders deleted" });
      }

      return res.status(400).json({ success: false, message: "No ID or IDs provided for deletion" });
    }

    // If it's not GET, POST, or DELETE, block it
    return res.status(405).json({ message: "Method not allowed" });

  } catch (error) {
    console.error("Database error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
