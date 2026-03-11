import { VercelRequest, VercelResponse } from '@vercel/node';
import { MongoClient } from 'mongodb';

let cachedDb: any = null;
let client: MongoClient | null = null;

async function connectToDatabase() {
  if (cachedDb) return cachedDb;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is missing in Vercel Environment Variables');
  }

  // Notice how the connection is safely inside the function now!
  if (!client) {
    client = new MongoClient(uri);
    await client.connect();
  }

  const db = client.db('ms-delivery'); 
  cachedDb = db;
  return db;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const db = await connectToDatabase();
    const collection = db.collection('profile');

    if (req.method === 'GET') {
      const profile = await collection.findOne({});
      return res.status(200).json(profile || { 
        companyName: '', ownerName: '', contactEmail: '', logoUrl: '' 
      });
    }

    if (req.method === 'PUT') {
      const { _id, ...profileData } = req.body;
      await collection.updateOne({}, { $set: profileData }, { upsert: true });
      return res.status(200).json({ message: 'Success' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
// Add this at the bottom of api/profile.ts
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};
