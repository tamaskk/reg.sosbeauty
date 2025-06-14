import { NextApiRequest, NextApiResponse } from 'next';
import { connectDB } from '../../../../lib/mongodb/mongodb';
import Provider from '../../../../lib/mongodb/models/Provider';
import { storage } from '../../../../lib/firebase/firebase';
import { ref, deleteObject } from 'firebase/storage';

async function deleteFileFromFirebase(url: string) {
  try {
    // Extract the path from the Firebase Storage URL
    const storageUrl = new URL(url);
    const path = decodeURIComponent(storageUrl.pathname.split('/o/')[1].split('?')[0]);
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
    console.log('Successfully deleted file:', path);
    return true;
  } catch (error) {
    console.error('Error deleting file from Firebase:', error);
    return false;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ message: 'Invalid provider ID' });
  }

  if (req.method !== 'DELETE') {
    res.setHeader('Allow', ['DELETE']);
    return res.status(405).json({ message: `Method ${req.method} not allowed` });
  }

  try {
    await connectDB();

    const provider = await Provider.findById(id);
    if (!provider) {
      return res.status(404).json({ message: 'Provider not found' });
    }

    console.log('Found provider for media deletion:', provider.name);
    const deletePromises = [];

    // Delete all images
    if (provider.media.images?.length) {
      console.log('Deleting images:', provider.media.images.length);
      for (const image of provider.media.images) {
        const url = typeof image === 'string' ? image : image.url;
        if (url) {
          deletePromises.push(deleteFileFromFirebase(url));
        }
      }
    }

    // Delete all videos
    if (provider.media.videos?.length) {
      console.log('Deleting videos:', provider.media.videos.length);
      for (const video of provider.media.videos) {
        const url = typeof video === 'string' ? video : video.url;
        if (url) {
          deletePromises.push(deleteFileFromFirebase(url));
        }
      }
    }

    // Wait for all deletions to complete
    console.log('Waiting for all file deletions to complete...');
    await Promise.all(deletePromises);

    // Clear the media arrays
    console.log('Clearing media arrays from provider document...');
    provider.media.images = [];
    provider.media.videos = [];
    await provider.save();
    console.log('Provider media arrays cleared successfully');

    res.status(200).json({ message: 'All media deleted successfully' });
  } catch (error) {
    console.error('Error deleting provider media:', error);
    res.status(500).json({ 
      message: 'Error deleting provider media',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 