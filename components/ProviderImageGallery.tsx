import { useState } from 'react';
import Image from 'next/image';

interface ProviderImage {
  url: string;
  isMain: boolean;
}

interface ProviderImageGalleryProps {
  providerId: string;
  images: ProviderImage[];
  onImagesUpdate: (images: ProviderImage[]) => void;
}

export default function ProviderImageGallery({ providerId, images, onImagesUpdate }: ProviderImageGalleryProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError('');

    try {
      // Here you would typically upload the file to your storage service
      // and get back a URL. For now, we'll use a mock URL
      const imageUrl = URL.createObjectURL(file);

      const response = await fetch(`/api/providers/${providerId}/images`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageUrl }),
      });

      if (!response.ok) {
        throw new Error('Failed to upload image');
      }

      const data = await response.json();
      onImagesUpdate(data.images);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSetMainImage = async (imageUrl: string) => {
    try {
      const response = await fetch(`/api/providers/${providerId}/images`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageUrl, isMain: true }),
      });

      if (!response.ok) {
        throw new Error('Failed to update main image');
      }

      const data = await response.json();
      onImagesUpdate(data.images);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update main image');
    }
  };

  const handleDeleteImage = async (imageUrl: string) => {
    if (!confirm('Are you sure you want to delete this image?')) return;

    try {
      const response = await fetch(`/api/providers/${providerId}/images`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageUrl }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete image');
      }

      const data = await response.json();
      onImagesUpdate(data.images);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete image');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Images</h3>
        <label className="cursor-pointer bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">
          <span>{isUploading ? 'Uploading...' : 'Upload Image'}</span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
            disabled={isUploading}
          />
        </label>
      </div>

      {error && (
        <div className="text-red-500 text-sm">{error}</div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {images.map((image, index) => (
          <div key={index} className="relative group">
            <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-lg bg-gray-200">
              <Image
                src={image.url}
                alt={`Provider image ${index + 1}`}
                layout="fill"
                objectFit="cover"
                className="group-hover:opacity-75"
              />
            </div>
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity flex items-center justify-center space-x-2">
              <button
                onClick={() => handleSetMainImage(image.url)}
                className={`p-2 rounded-full ${
                  image.isMain
                    ? 'bg-green-500 text-white'
                    : 'bg-white text-gray-800 hover:bg-gray-100'
                }`}
                title={image.isMain ? 'Main image' : 'Set as main image'}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
              <button
                onClick={() => handleDeleteImage(image.url)}
                className="p-2 rounded-full bg-white text-red-600 hover:bg-red-50"
                title="Delete image"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
            {image.isMain && (
              <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs">
                Main
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
} 