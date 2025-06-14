import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Image from 'next/image';
import ProviderViewModal from '@/components/ProviderViewModal';
import { Provider } from '@/lib/types/provider';

type ProviderData = Provider & {
  _id: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode?: string;
  };
  media: {
    images: Array<{
      url: string;
      name: string;
      isMain: boolean;
    }>;
    videos: Array<{
      url: string;
      isMain: boolean;
    }>;
  };
};

const defaultProvider: ProviderData = {
  _id: '',
  name: '',
  category: '',
  phoneNumber: '',
  houseNumber: '',
  email: '',
  minPrice: 0,
  maxPrice: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
  instagram: '',
  facebook: '',
  tiktok: '',
  success: false,
  street: '',
  postalCode: '',
  city: '',
  country: '',
  address: {
    street: '',
    city: '',
    state: '',
    zipCode: ''
  },
  media: {
    images: [],
    videos: []
  }
};

export default function ProvidersList() {
  const router = useRouter();
  const [providers, setProviders] = useState<ProviderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<ProviderData>(defaultProvider);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    try {
      const response = await fetch('/api/providers');
      if (!response.ok) throw new Error('Failed to fetch providers');
      const data = await response.json();
      setProviders(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleView = (provider: ProviderData) => {
    setSelectedProvider(provider);
    setIsViewModalOpen(true);
  };

  if (loading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;

  return (
    <div className="min-h-screen bg-gray-100">
      <Head>
        <title>Providers - SOS Beauty Admin</title>
      </Head>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">Providers</h1>
            <button
              onClick={() => router.push('/admin/providers/new')}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
            >
              Add New Provider
            </button>
          </div>

          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {providers.map((provider) => (
                <li key={provider._id}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        {provider.media.images[0] && (
                          <Image
                            src={typeof provider.media.images[0] === 'string' ? provider.media.images[0] : provider.media.images[0].url}
                            alt={provider.name}
                            width={48}
                            height={48}
                            className="h-12 w-12 rounded-full object-cover mr-4"
                          />
                        )}
                        <div>
                          <p className="text-sm font-medium text-indigo-600 truncate">{provider.name}</p>
                          <p className="text-sm text-gray-500">{provider.category}</p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleView(provider)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          View
                        </button>
                        <button
                          onClick={() => router.push(`/admin/providers/${provider._id}/edit`)}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                    <div className="mt-2 sm:flex sm:justify-between">
                      <div className="sm:flex">
                        <p className="flex items-center text-sm text-gray-500">
                          {provider.email}
                        </p>
                        <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                          {provider.phoneNumber}
                        </p>
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                        <p>
                          {provider.city}, {provider.country}
                        </p>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <ProviderViewModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        provider={selectedProvider}
      />
    </div>
  );
} 