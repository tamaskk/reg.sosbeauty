import { NextApiRequest, NextApiResponse } from 'next';
import { connectDB } from '../../../lib/mongodb/mongodb';
import Provider from '../../../lib/mongodb/models/Provider';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await connectDB();

  switch (req.method) {
    case 'GET':
      try {
        const providers = await Provider.find({}).sort({ createdAt: -1 });
        res.status(200).json(providers);
      } catch (error) {
        console.error('Error fetching providers:', error);
        res.status(500).json({ message: 'Error fetching providers' });
      }
      break;

    case 'POST':
      try {
        const provider = new Provider(req.body);
        await provider.save();
        res.status(201).json({ message: 'Provider registered successfully', provider });
      } catch (error) {
        console.error('Error registering provider:', error);
        res.status(500).json({ message: 'Error registering provider' });
      }
      break;

    default:
      res.status(405).json({ message: 'Method not allowed' });
      break;
  }
} 