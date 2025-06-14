import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { Tab } from '@headlessui/react';
import { EyeIcon, CheckIcon, TrashIcon } from '@heroicons/react/24/outline';
import JSZip from 'jszip';
import ProviderViewModal from '@/components/ProviderViewModal';
import { IProvider } from '@/lib/types/provider';

interface ProviderWithMedia extends IProvider {
  media: {
    images: Array<{
      url: string;
      name: string;
    }>;
  };
}

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [providers, setProviders] = useState<ProviderWithMedia[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<ProviderWithMedia | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/auth/login');
    }
  }, [status, router]);

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    try {
      const response = await fetch('/api/providers');
      if (!response.ok) {
        throw new Error('Failed to fetch providers');
      }
      const data = await response.json();
      console.log('API Response:', data); // Debug log

      // Handle both array response and { providers: [] } response
      const providersArray = Array.isArray(data) ? data : (data.providers || []);
      
      if (!Array.isArray(providersArray)) {
        console.error('Invalid providers data:', data);
        throw new Error('Invalid providers data structure');
      }

      const transformedProviders = providersArray.map((provider: any) => {
        if (!provider) {
          console.error('Invalid provider object:', provider);
          return null;
        }

        // Ensure media object exists
        const media = provider.media || { images: [], videos: [] };
        
        return {
          ...provider,
          address: {
            street: provider.street || '',
            city: provider.city || '',
            state: provider.country || '',
            zipCode: provider.postalCode || ''
          },
          media: {
            images: (media.images || []).map((img: any) => ({
              url: typeof img === 'string' ? img : (img?.url || ''),
              name: typeof img === 'string' ? '' : (img?.name || ''),
              isMain: typeof img === 'string' ? false : (img?.isMain || false)
            })),
            videos: (media.videos || []).map((vid: any) => ({
              url: typeof vid === 'string' ? vid : (vid?.url || ''),
              isMain: typeof vid === 'string' ? false : (vid?.isMain || false)
            }))
          }
        };
      }).filter(Boolean); // Remove any null entries

      setProviders(transformedProviders);
    } catch (err) {
      console.error('Error fetching providers:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const response = await fetch(`/api/providers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: true }),
      });

      if (!response.ok) {
        throw new Error('Failed to approve provider');
      }

      setProviders(providers.map(provider =>
        provider._id === id ? { ...provider, success: true } : provider
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Biztosan törölni szeretnéd ezt a szolgáltatót?')) {
      return;
    }

    try {
      const response = await fetch(`/api/providers/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete provider');
      }

      setProviders(providers.filter(provider => provider._id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleView = (provider: ProviderWithMedia) => {
    setSelectedProvider(provider);
  };

  const handleDeleteProvider = async (providerId: string) => {
    try {
      const response = await fetch(`/api/providers/${providerId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete provider');
      setProviders(providers.filter(p => p._id !== providerId));
    } catch (err: unknown) {
      console.error('Error deleting provider:', err);
    }
  };

  const handleDeleteMedia = async (providerId: string, mediaUrl: string) => {
    try {
      const response = await fetch(`/api/providers/${providerId}/media`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mediaUrl }),
      });
      if (!response.ok) throw new Error('Failed to delete media');
      // Update the provider's media list
      setProviders(providers.map(p => {
        if (p._id === providerId) {
          return {
            ...p,
            media: {
              ...p.media,
              images: p.media.images.filter(img => img.url !== mediaUrl)
            }
          };
        }
        return p;
      }));
    } catch (err: unknown) {
      console.error('Error deleting media:', err);
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Admin Irányítópult - SOS Beauty</title>
        <meta name="description" content="SOS Beauty admin irányítópult" />
      </Head>

      <div className="min-h-screen bg-gray-100">
        <nav className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                <div className="flex-shrink-0 flex items-center">
                  <h1 className="text-xl font-bold text-gray-900">SOS Beauty Admin</h1>
                </div>
              </div>
              <div className="flex items-center">
                <span className="text-gray-700 mr-4">{session?.user?.email}</span>
                <button
                  onClick={() => router.push('/api/auth/signout')}
                  className="text-gray-700 hover:text-gray-900"
                >
                  Kijelentkezés
                </button>
              </div>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {error && (
            <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">
              {error}
            </div>
          )}

          <Tab.Group>
            <Tab.List className="flex space-x-1 rounded-xl bg-blue-900/20 p-1">
              <Tab
                className={({ selected }) =>
                  classNames(
                    'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                    'ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2',
                    selected
                      ? 'bg-white shadow text-blue-700'
                      : 'text-blue-100 hover:bg-white/[0.12] hover:text-white'
                  )
                }
              >
                Űrlapok
              </Tab>
              <Tab
                className={({ selected }) =>
                  classNames(
                    'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                    'ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2',
                    selected
                      ? 'bg-white shadow text-blue-700'
                      : 'text-blue-100 hover:bg-white/[0.12] hover:text-white'
                  )
                }
              >
                Üzenetek
              </Tab>
            </Tab.List>
            <Tab.Panels className="mt-4">
              <Tab.Panel>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {providers.map((provider) => (
                    <div
                      key={provider._id}
                      className="bg-white overflow-hidden shadow rounded-lg flex flex-col"
                    >
                      <div className="relative h-48 w-full">
                        {provider.media.images[0] ? (
                          <img
                            src={typeof provider.media.images[0] === 'string' 
                              ? provider.media.images[0] 
                              : provider.media.images[0].url}
                            alt={provider.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                            <span className="text-gray-400">Nincs kép</span>
                          </div>
                        )}
                      </div>
                      <div className="p-4 flex-grow flex flex-col">
                        <div className="mb-4">
                          <h3 className="text-lg font-medium text-gray-900 mb-1">{provider.name}</h3>
                          <p className="text-sm text-gray-500">{provider.category}</p>
                        </div>
                        <div className="mt-auto">
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => handleView(provider)}
                              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                              <EyeIcon className="h-4 w-4 mr-1.5" />
                              Megtekintés
                            </button>
                            <button
                              onClick={() => handleApprove(provider._id)}
                              disabled={provider.success}
                              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                            >
                              <CheckIcon className="h-4 w-4 mr-1.5" />
                              Jóváhagyás
                            </button>
                            <button
                              onClick={() => handleDelete(provider._id)}
                              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                            >
                              <TrashIcon className="h-4 w-4 mr-1.5" />
                              Törlés
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Tab.Panel>
              <Tab.Panel>
                <div className="bg-white shadow rounded-lg p-6">
                  <p className="text-gray-500">Még nincsenek üzenetek.</p>
                </div>
              </Tab.Panel>
            </Tab.Panels>
          </Tab.Group>
        </main>

        <ProviderViewModal
          isOpen={selectedProvider !== null}
          onClose={() => setSelectedProvider(null)}
          provider={selectedProvider}
        />
      </div>
    </>
  );
} 