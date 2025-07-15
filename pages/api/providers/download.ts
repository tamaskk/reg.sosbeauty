import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { url } = req.query;

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ message: 'URL is required' });
  }

  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.statusText}`);
    }

    // Get current date/time
    const currentDate = new Date().toUTCString();

    // Forward the content type
    res.setHeader('Content-Type', response.headers.get('content-type') || 'application/octet-stream');
    
    // Forward the content disposition to trigger download
    const contentDisposition = response.headers.get('content-disposition');
    if (contentDisposition) {
      res.setHeader('Content-Disposition', contentDisposition);
    }

    // Set current date as the last modified date and date header
    // This will make the file appear with today's date in the iPhone gallery
    res.setHeader('Last-Modified', currentDate);
    res.setHeader('Date', currentDate);

    // Stream the response
    const buffer = await response.arrayBuffer();
    res.send(Buffer.from(buffer));
  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).json({ message: 'Error downloading file' });
  }
} 