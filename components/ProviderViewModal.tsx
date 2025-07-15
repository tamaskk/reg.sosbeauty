import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useState, useEffect } from 'react';
import { XMarkIcon, CheckIcon, ArrowDownTrayIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { Provider } from '@/lib/types/provider';
import Image from 'next/image';

const MAPBOX_TOKEN = "pk.eyJ1Ijoia2FsbWFudG9taWthIiwiYSI6ImNtMzNiY3pvdDEwZDIya3I2NWwxanJ6cXIifQ.kiSWtgrH6X-l0TpquCKiXA";

interface Coordinates {
  lng: number;
  lat: number;
}

interface ProviderWithMedia extends Provider {
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
}

interface ProviderViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  provider: ProviderWithMedia | null;
}

interface Notification {
  id: string;
  type: 'info' | 'success' | 'error';
  message: string;
  autoClose?: boolean;
}

const fetchCoordinates = async (address: {
  street: string;
  houseNumber: string;
  city: string;
  postalCode: string;
  country: string;
}): Promise<Coordinates | null> => {
  try {
    const query = `${address.street} ${address.houseNumber}, ${address.postalCode} ${address.city}, ${address.country}`;
    const encodedQuery = encodeURIComponent(query);
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedQuery}.json?access_token=${MAPBOX_TOKEN}`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch coordinates');
    }

    const data = await response.json();
    if (data.features && data.features.length > 0) {
      const [lng, lat] = data.features[0].center;
      return { lng, lat };
    }
    return null;
  } catch (error) {
    console.error('Error fetching coordinates:', error);
    return null;
  }
};

const CopyableBox = ({ label, value, children, onCopy }: { 
  label: string; 
  value?: string; 
  children?: React.ReactNode; 
  onCopy?: (message: string) => void; 
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (value) {
      try {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        
        // Show notification
        if (onCopy) {
          onCopy(`"${label}" másolva a vágólapra!`);
        }
        
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error('Failed to copy:', error);
        if (onCopy) {
          onCopy(`HIBA: Nem sikerült másolni: ${label}`);
        }
      }
    }
  };

  return (
    <div className="relative group">
      <div
        onClick={handleCopy}
        className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 cursor-pointer transition-colors"
      >
        <div className="text-sm font-medium text-gray-900 mb-1">{label}</div>
        {children || <div className="text-gray-600">{value}</div>}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {copied ? (
            <CheckIcon className="h-5 w-5 text-green-500" />
          ) : (
            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
            </svg>
          )}
        </div>
      </div>
    </div>
  );
};

export default function ProviderViewModal({ isOpen, onClose, provider }: ProviderViewModalProps) {
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [isLoadingCoordinates, setIsLoadingCoordinates] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [currentDownloadFile, setCurrentDownloadFile] = useState<string>('');

  // Notification functions
  const addNotification = (notification: Omit<Notification, 'id'>) => {
    const id = Date.now().toString();
    const newNotification = { ...notification, id };
    setNotifications(prev => [...prev, newNotification]);
    
    if (notification.autoClose !== false) {
      setTimeout(() => {
        removeNotification(id);
      }, 5000);
    }
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleCopyNotification = (message: string) => {
    const isError = message.startsWith('HIBA:');
    addNotification({ 
      type: isError ? 'error' : 'success', 
      message: isError ? message.replace('HIBA: ', '') : message 
    });
  };

  useEffect(() => {
    const getCoordinates = async () => {
      if (provider) {
        setIsLoadingCoordinates(true);
        const coords = await fetchCoordinates({
          street: provider.address.street,
          houseNumber: provider.houseNumber,
          city: provider.address.city,
          postalCode: provider.address.zipCode || '',
          country: provider.address.state
        });
        setCoordinates(coords);
        setIsLoadingCoordinates(false);
      }
    };

    if (isOpen && provider) {
      getCoordinates();
    }
  }, [isOpen, provider]);

  const downloadFile = async (url: string, filename: string) => {
    try {
      // Use our API endpoint to proxy the download
      const response = await fetch(`/api/providers/download?url=${encodeURIComponent(url)}`);
      
      if (!response.ok) {
        throw new Error(`Failed to download file: ${response.statusText}`);
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Error downloading file:', error);
      throw error;
    }
  };

  const downloadAllMedia = async () => {
    if (!provider) return;

    setIsDownloading(true);
    setDownloadProgress(0);
    setCurrentDownloadFile('');

    const allMedia = [
      ...provider.media.images.map((img, index) => ({
        url: img.url,
        filename: `${provider.name}_image_${index + 1}.${img.url.split('.').pop()?.split('?')[0] || 'jpg'}`
      })),
      ...provider.media.videos.map((vid, index) => ({
        url: vid.url,
        filename: `${provider.name}_video_${index + 1}.${vid.url.split('.').pop()?.split('?')[0] || 'mp4'}`
      }))
    ];

    const totalFiles = allMedia.length;
    let completedFiles = 0;

    // Show initial download notification
    addNotification({
      type: 'info',
      message: `Letöltés kezdődik... ${totalFiles} fájl letöltése`,
      autoClose: false
    });

    for (const media of allMedia) {
      try {
        setCurrentDownloadFile(media.filename);
        
        // Show progress notification
        addNotification({
          type: 'info',
          message: `Letöltés: ${media.filename} (${completedFiles + 1}/${totalFiles})`,
          autoClose: false
        });

        await downloadFile(media.url, media.filename);
        completedFiles++;
        setDownloadProgress((completedFiles / totalFiles) * 100);
        
        // Add 3 second delay between downloads
        if (completedFiles < totalFiles) {
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      } catch (error) {
        console.error(`Error downloading ${media.filename}:`, error);
        addNotification({
          type: 'error',
          message: `Hiba történt a fájl letöltése közben: ${media.filename}`,
          autoClose: true
        });
      }
    }

    setIsDownloading(false);
    setDownloadProgress(0);
    setCurrentDownloadFile('');
    
    // Clear previous notifications and show success
    setNotifications([]);
    addNotification({
      type: 'success',
      message: `Sikeres letöltés! ${completedFiles} fájl sikeresen letöltve.`,
      autoClose: true
    });
  };

  if (!provider) return null;

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="div"
                  className="flex items-center justify-between mb-6"
                >
                  <h3 className="text-xl font-medium leading-6 text-gray-900">
                    {provider.name}
                  </h3>
                  <div className="flex items-center space-x-2">
                    {(provider.media.images.length > 0 || provider.media.videos.length > 0) && (
                      <button
                        type="button"
                        onClick={downloadAllMedia}
                        disabled={isDownloading}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                        {isDownloading ? (
                          <span className="flex flex-col items-start">
                            <span>{`Letöltés... ${Math.round(downloadProgress)}%`}</span>
                            {currentDownloadFile && (
                              <span className="text-xs opacity-75 truncate max-w-32">
                                {currentDownloadFile}
                              </span>
                            )}
                          </span>
                        ) : 'Összes fájl letöltése'}
                      </button>
                    )}
                    <button
                      type="button"
                      className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none"
                      onClick={onClose}
                    >
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </div>
                </Dialog.Title>

                {/* Notification System */}
                {notifications.length > 0 && (
                  <div className="fixed top-4 right-4 z-50 space-y-2">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 w-[200px] min-w-fit rounded-lg shadow-lg ${
                          notification.type === 'success' 
                            ? 'bg-green-50 border border-green-200' 
                            : notification.type === 'error' 
                            ? 'bg-red-50 border border-red-200'
                            : 'bg-blue-50 border border-blue-200'
                        }`}
                      >
                        <div className="flex items-start">
                          <div className="flex-shrink-0">
                            {notification.type === 'success' && (
                              <CheckIcon className="h-5 w-5 text-green-400" />
                            )}
                            {notification.type === 'error' && (
                              <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                            )}
                            {notification.type === 'info' && (
                              <ArrowDownTrayIcon className="h-5 w-5 text-blue-400" />
                            )}
                          </div>
                          <div className="ml-3 w-0 flex-1">
                            <p className={`text-sm font-medium ${
                              notification.type === 'success' 
                                ? 'text-green-800' 
                                : notification.type === 'error' 
                                ? 'text-red-800'
                                : 'text-blue-800'
                            }`}>
                              {notification.message}
                            </p>
                          </div>
                          <div className="ml-4 flex-shrink-0 flex">
                            <button
                              type="button"
                              className={`rounded-md inline-flex ${
                                notification.type === 'success' 
                                  ? 'text-green-400 hover:text-green-500' 
                                  : notification.type === 'error' 
                                  ? 'text-red-400 hover:text-red-500'
                                  : 'text-blue-400 hover:text-blue-500'
                              } focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                                notification.type === 'success' 
                                  ? 'focus:ring-green-500' 
                                  : notification.type === 'error' 
                                  ? 'focus:ring-red-500'
                                  : 'focus:ring-blue-500'
                              }`}
                              onClick={() => removeNotification(notification.id)}
                            >
                              <XMarkIcon className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-2 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <CopyableBox label="Kategória" value={provider.category} onCopy={handleCopyNotification} />
                    <CopyableBox label="Email (10. variant)" value={provider.email} onCopy={handleCopyNotification} />
                    <CopyableBox label="Telefonszám (3. variant)" value={provider.phoneNumber} onCopy={handleCopyNotification} />
                    <CopyableBox label="Minimum ár (1. variant)" value={`${provider.minPrice} Ft`} onCopy={handleCopyNotification} />
                    <CopyableBox label="Maximum ár (2. variant)" value={`${provider.maxPrice} Ft`} onCopy={handleCopyNotification} />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <CopyableBox label="Cím (6. variant)" value={`${provider.address.street} ${provider.houseNumber}`} onCopy={handleCopyNotification} />
                    <CopyableBox label="Irányítószám (6. variant)" value={provider.address.zipCode || ''} onCopy={handleCopyNotification} />
                    <CopyableBox label="Város (6. variant)" value={provider.address.city} onCopy={handleCopyNotification} />
                    <CopyableBox label="Ország (6. variant)" value={provider.address.state} onCopy={handleCopyNotification} />
                    {isLoadingCoordinates ? (
                      <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="text-sm font-medium text-gray-900 mb-1">Koordináták</div>
                        <div className="text-gray-600">Betöltés...</div>
                      </div>
                    ) : coordinates ? (
                      <>
                        <CopyableBox 
                          label="Hosszúság (5. variant)" 
                          value={coordinates.lng.toFixed(6)} 
                          onCopy={handleCopyNotification}
                        />
                        <CopyableBox 
                          label="Szélesség (4. variant)" 
                          value={coordinates.lat.toFixed(6)} 
                          onCopy={handleCopyNotification}
                        />
                      </>
                    ) : (
                      <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="text-sm font-medium text-gray-900 mb-1">Koordináták</div>
                        <div className="text-gray-600">Nem található</div>
                      </div>
                    )}
                  </div>

                  {(provider.instagram || provider.facebook || provider.tiktok) && (
                    <div className="space-y-2">
                      {provider.instagram && (
                        <CopyableBox label="Instagram (7. variant)" value={provider.instagram} onCopy={handleCopyNotification}>
                          <a
                            target="_blank"
                            rel="noopener noreferrer"
                            href={provider.instagram.startsWith('http') ? provider.instagram : `https://instagram.com/${provider.instagram}`}
                            className="text-indigo-600 hover:text-indigo-500"
                          >
                            {provider.instagram}
                          </a>
                        </CopyableBox>
                      )}
                      {provider.facebook && (
                        <CopyableBox label="Facebook (8. variant)" value={provider.facebook} onCopy={handleCopyNotification}>
                          <a
                            target="_blank"
                            rel="noopener noreferrer"
                            href={provider.facebook.startsWith('http') ? provider.facebook : `https://facebook.com/${provider.facebook}`}
                            className="text-indigo-600 hover:text-indigo-500"
                          >
                            {provider.facebook}
                          </a>
                        </CopyableBox>
                      )}
                      {provider.tiktok && (
                        <CopyableBox label="TikTok (9. variant)" value={provider.tiktok} onCopy={handleCopyNotification}>
                          <a
                            target="_blank"
                            rel="noopener noreferrer"
                            href={provider.tiktok.startsWith('http') ? provider.tiktok : `https://tiktok.com/@${provider.tiktok}`}
                            className="text-indigo-600 hover:text-indigo-500"
                          >
                            {provider.tiktok}
                          </a>
                        </CopyableBox>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <CopyableBox 
                      label="Létrehozva" 
                      value={new Date(provider.createdAt).toLocaleString('hu-HU')} 
                      onCopy={handleCopyNotification}
                    />
                    <CopyableBox 
                      label="Módosítva" 
                      value={new Date(provider.updatedAt).toLocaleString('hu-HU')} 
                      onCopy={handleCopyNotification}
                    />
                  </div>

                  {provider.media.images.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Képek</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {provider.media.images.map((image, index) => (
                          <div key={index} className="relative aspect-square">
                            <Image
                              src={image.url}
                              alt={`${provider.name} - ${index + 1}. kép`}
                              fill
                              className="object-cover rounded-lg"
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {provider.media.videos.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Videók</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {provider.media.videos.map((video, index) => (
                          <div key={index} className="relative aspect-video">
                            <video
                              src={video.url}
                              controls
                              className="w-full h-full object-cover rounded-lg"
                            />
                            {video.isMain && (
                              <span className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                                Fő
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
} 