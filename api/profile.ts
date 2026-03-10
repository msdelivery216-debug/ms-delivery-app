import { VercelRequest, VercelResponse } from '@vercel/node';
import { MongoClient } from 'mongodb';

const client = new MongoClient(process.env.MONGODB_URI || '');

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    await client.connect();
    const db = client.db('ms-delivery'); // Use your actual database name
    const collection = db.collection('profile');

    // 1. GET: Fetch the profile data
    if (req.method === 'GET') {
      const profile = await collection.findOne({});
      // If no profile exists yet, return empty defaults
      return res.status(200).json(profile || { 
        companyName: '', 
        ownerName: '', 
        contactEmail: '', 
        logoUrl: '' 
      });
    }

    // 2. PUT: Save or Update the profile data
    if (req.method === 'PUT') {
      const updatedProfile = req.body;
      // This updates the first document it finds, or creates one if it's empty (upsert)
      await collection.updateOne(
        {}, 
        { $set: updatedProfile }, 
        { upsert: true }
      );
      return res.status(200).json({ message: 'Profile updated successfully' });
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    return res.status(500).json({ error: 'Database connection failed' });
  } finally {
    await client.close();
  }
}
