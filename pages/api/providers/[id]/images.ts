import { NextApiRequest, NextApiResponse } from 'next';
import { connectDB } from '../../../../lib/mongodb/mongodb';
import Provider, { IProvider } from '../../../../lib/mongodb/models/Provider';

interface ProviderImage {
  url: string;
  isMain: boolean;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ message: 'Invalid provider ID' });
  }

  await connectDB();

  if (req.method === 'POST') {
    try {
      const { imageUrl } = req.body;
      
      if (!imageUrl) {
        return res.status(400).json({ message: 'Image URL is required' });
      }

      const provider = await Provider.findById(id);
      
      if (!provider) {
        return res.status(404).json({ message: 'Provider not found' });
      }

      // If this is the first image, set it as main
      const isMain = provider.media.images.length === 0;

      provider.media.images.push({
        url: imageUrl,
        isMain
      });

      await provider.save();

      res.status(200).json({ 
        message: 'Image added successfully',
        images: provider.media.images
      });
    } catch (error) {
      console.error('Error adding image:', error);
      res.status(500).json({ message: 'Error adding image' });
    }
  } else if (req.method === 'PUT') {
    try {
      const { imageUrl, isMain } = req.body;

      if (typeof isMain !== 'boolean') {
        return res.status(400).json({ message: 'isMain must be a boolean' });
      }

      const provider = await Provider.findById(id);
      
      if (!provider) {
        return res.status(404).json({ message: 'Provider not found' });
      }

      // Find the image and update its isMain status
      const imageIndex = provider.media.images.findIndex((img: ProviderImage) => img.url === imageUrl);
      
      if (imageIndex === -1) {
        return res.status(404).json({ message: 'Image not found' });
      }

      // If setting this image as main, unset any other main image
      if (isMain) {
        provider.media.images.forEach((img: ProviderImage) => img.isMain = false);
      }

      provider.media.images[imageIndex].isMain = isMain;
      await provider.save();

      res.status(200).json({ 
        message: 'Image updated successfully',
        images: provider.media.images
      });
    } catch (error) {
      console.error('Error updating image:', error);
      res.status(500).json({ message: 'Error updating image' });
    }
  } else if (req.method === 'DELETE') {
    try {
      const { imageUrl } = req.body;

      const provider = await Provider.findById(id);
      
      if (!provider) {
        return res.status(404).json({ message: 'Provider not found' });
      }

      const imageIndex = provider.media.images.findIndex((img: ProviderImage) => img.url === imageUrl);
      
      if (imageIndex === -1) {
        return res.status(404).json({ message: 'Image not found' });
      }

      const wasMain = provider.media.images[imageIndex].isMain;
      
      // Remove the image
      provider.media.images.splice(imageIndex, 1);

      // If we deleted the main image and there are other images, set the first one as main
      if (wasMain && provider.media.images.length > 0) {
        provider.media.images[0].isMain = true;
      }

      await provider.save();

      res.status(200).json({ 
        message: 'Image deleted successfully',
        images: provider.media.images
      });
    } catch (error) {
      console.error('Error deleting image:', error);
      res.status(500).json({ message: 'Error deleting image' });
    }
  } else {
    res.setHeader('Allow', ['POST', 'PUT', 'DELETE']);
    res.status(405).json({ message: `Method ${req.method} not allowed` });
  }
} 