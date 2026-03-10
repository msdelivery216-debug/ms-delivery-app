import { VercelRequest, VercelResponse } from '@vercel/node';
import { MongoClient } from 'mongodb';

// 1. Create the client outside the handler to reuse the connection
const client = new MongoClient(process.env.MONGODB_URI || '');
let cachedDb: any = null;

async function connectToDatabase() {
  if (cachedDb) return cachedDb;
  await client.connect();
  // IMPORTANT: Make sure this matches your DB name in MongoDB Atlas
  const db = client.db('ms-delivery'); 
  cachedDb = db;
  return db;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Add CORS headers so the frontend can talk to the backend
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const db = await connectToDatabase();
    const collection = db.collection('profile');

    if (req.method === 'GET') {
      const profile = await collection.findOne({});
      return res.status(200).json(profile || { 
        companyName: '', 
        ownerName: '', 
        contactEmail: '', 
        logoUrl: '' 
      });
    }

    if (req.method === 'PUT') {
      const updatedProfile = req.body;
      // We don't want to save the MongoDB _id if it's already there
      const { _id, ...profileData } = updatedProfile;
      
      await collection.updateOne(
        {}, 
        { $set: profileData }, 
        { upsert: true }
      );
      return res.status(200).json({ message: 'Success' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error("Database Error:", error);
    // This sends a JSON error instead of a plain text "A server error..."
    return res.status(500).json({ error: error.message });
  }
}
