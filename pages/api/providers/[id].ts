import { NextApiRequest, NextApiResponse } from 'next';
import { connectDB } from '../../../lib/mongodb/mongodb';
import Provider from '../../../lib/mongodb/models/Provider';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ message: 'Invalid provider ID' });
  }

  try {
    await connectDB();

    switch (req.method) {
      case 'GET':
        const provider = await Provider.findById(id);
        if (!provider) {
          return res.status(404).json({ message: 'Provider not found' });
        }
        res.status(200).json(provider);
        break;

      case 'PATCH':
        // If this is an approval (setting success to true), delete the media files
        if (req.body.success === true) {
          try {
            console.log('Provider approved, deleting media files...');
            const mediaResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/providers/${id}/media`, {
              method: 'DELETE',
            });
            
            if (!mediaResponse.ok) {
              console.error('Failed to delete provider media:', await mediaResponse.text());
            } else {
              console.log('Provider media files deleted successfully');
            }
          } catch (error) {
            console.error('Error deleting provider media:', error);
          }
        }

        const updatedProvider = await Provider.findByIdAndUpdate(
          id,
          { $set: req.body },
          { new: true }
        );
        if (!updatedProvider) {
          return res.status(404).json({ message: 'Provider not found' });
        }
        res.status(200).json(updatedProvider);
        break;

      case 'DELETE':
        // First, delete all media files
        try {
          const mediaResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/providers/${id}/media`, {
            method: 'DELETE',
          });
          
          if (!mediaResponse.ok) {
            console.error('Failed to delete provider media:', await mediaResponse.text());
          }
        } catch (error) {
          console.error('Error deleting provider media:', error);
        }

        // Then delete the provider
        const deletedProvider = await Provider.findByIdAndDelete(id);
        if (!deletedProvider) {
          return res.status(404).json({ message: 'Provider not found' });
        }
        res.status(200).json({ message: 'Provider and associated media deleted successfully' });
        break;

      default:
        res.setHeader('Allow', ['GET', 'PATCH', 'DELETE']);
        res.status(405).json({ message: `Method ${req.method} not allowed` });
    }
  } catch (error) {
    console.error('Error handling provider:', error);
    res.status(500).json({ message: 'Error handling provider' });
  }
} 