// @ts-nocheck
import { VercelRequest, VercelResponse } from '@vercel/node';
import mongoose from 'mongoose';

// Grab the secure database link from your environment variables
const MONGODB_URI = process.env.MONGODB_URI || "";

// 1. Define what a "Client" looks like in your database
const clientSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  address: String,
  status: { type: String, default: 'Active' }
}, { timestamps: true });

// 2. Create the Database Model
const Client = mongoose.models.Client || mongoose.model('Client', clientSchema);

// 3. The serverless function that handles all data requests
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Connect to MongoDB if not already connected
    if (mongoose.connection.readyState === 0) {
      if (!MONGODB_URI) throw new Error("Database URL is missing!");
      await mongoose.connect(MONGODB_URI);
    }

    // GET: Fetch all clients to display on the page
    if (req.method === 'GET') {
      const clients = await Client.find({});
      return res.status(200).json(clients);
    } 
    
    // POST: Add a brand new client
    if (req.method === 'POST') {
      const newClient = new Client(req.body);
      await newClient.save();
      return res.status(201).json(newClient);
    }

    // PUT: Edit an existing client's details
    if (req.method === 'PUT') {
      const { id } = req.query; // Grabs the ID from the URL
      if (!id) return res.status(400).json({ error: "Client ID is required" });
      
      const updatedClient = await Client.findByIdAndUpdate(id, req.body, { new: true });
      return res.status(200).json(updatedClient);
    }

    // DELETE: Remove a single client or bulk delete multiple
    if (req.method === 'DELETE') {
      const { id } = req.query;
      
      // Handle single delete (clicking the trash can on one client)
      if (id) {
        await Client.findByIdAndDelete(id);
        return res.status(200).json({ message: "Client deleted successfully" });
      }
      
      // Handle bulk delete (selecting checkboxes and deleting many)
      if (req.body && req.body.ids) {
        await Client.deleteMany({ _id: { $in: req.body.ids } });
        return res.status(200).json({ message: "Clients deleted successfully" });
      }

      return res.status(400).json({ error: "No ID provided for deletion" });
    }

    // Catch-all for other types of requests
    return res.status(405).json({ message: "Method not allowed" });

  } catch (error) {
    console.error("Database error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}