import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import ProviderInfoBox from '@/components/ProviderInfoBox';
import ProviderImageGallery from '@/components/ProviderImageGallery';
import { IProvider } from '@/lib/mongodb/models/Provider';

type ProviderData = Omit<IProvider, keyof Document> & {
  _id: string;
};

export default function ViewProvider() {
  const router = useRouter();
  const { id } = router.query;
  const [provider, setProvider] = useState<ProviderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      fetchProvider();
    }
  }, [id]);

  const fetchProvider = async () => {
    try {
      const response = await fetch(`/api/providers/${id}`);
      if (!response.ok) throw new Error('Failed to fetch provider');
      const data = await response.json();
      setProvider(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleImagesUpdate = (images: { url: string; isMain: boolean }[]) => {
    if (provider) {
      setProvider({
        ...provider,
        media: {
          ...provider.media,
          images,
        },
      });
    }
  };

  if (loading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;
  if (!provider) return <div className="p-4">Provider not found</div>;

  const fullAddress = `${provider.street} ${provider.houseNumber}, ${provider.city}, ${provider.postalCode}, ${provider.country}`;
  const socialMedia = [
    provider.instagram && `Instagram: ${provider.instagram}`,
    provider.facebook && `Facebook: ${provider.facebook}`,
    provider.tiktok && `TikTok: ${provider.tiktok}`,
  ].filter((item): item is string => Boolean(item));

  return (
    <div className="min-h-screen bg-gray-100">
      <Head>
        <title>Provider Details - {provider.name}</title>
      </Head>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">{provider.name}</h1>
            <button
              onClick={() => router.push(`/admin/providers/${id}/edit`)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
            >
              Edit Provider
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            <ProviderInfoBox label="Business Name" value={provider.name} />
            <ProviderInfoBox label="Category" value={provider.category} />
            <ProviderInfoBox label="Email" value={provider.email} />
            <ProviderInfoBox label="Phone" value={provider.phoneNumber} />
            <ProviderInfoBox label="Address" value={fullAddress} />
            <ProviderInfoBox label="Price Range" value={`${provider.minPrice} - ${provider.maxPrice}`} />
            <ProviderInfoBox label="Social Media" value={socialMedia} />
            <ProviderInfoBox label="Status" value={provider.success ? 'Active' : 'Inactive'} />
            <ProviderInfoBox label="Created At" value={new Date(provider.createdAt).toLocaleString()} />
            <ProviderInfoBox label="Last Updated" value={new Date(provider.updatedAt).toLocaleString()} />
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium mb-4">Images</h2>
            <ProviderImageGallery
              providerId={provider._id}
              images={provider.media.images}
              onImagesUpdate={handleImagesUpdate}
            />
          </div>
        </div>
      </div>
    </div>
  );
} 