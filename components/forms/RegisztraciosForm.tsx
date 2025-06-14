import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useDropzone } from 'react-dropzone';
import { useState, useEffect } from 'react';
import { uploadMultipleFiles, validateFileSize, validateFileType } from '../../lib/firebase/upload';
import Image from 'next/image';

const categories = [
  'Pillás',
  'Körmös',
  'Női fodrász',
  'Sminkes',
  'Szájfeltöltés',
  'Férfi fodrász',
  'Lézeres szőrtelenítés',
  'Kozmetikus',
  'Botox',
  'Sminktetoválás',
  'Gyanta',
  'Szemöldök szempilla styling',
  'Hajhosszabítás',
  'Pedikűr',
  'Fitness/mozgás'
] as const;

type Category = typeof categories[number];

type FormValues = {
  name: string;
  email: string;
  category: Category;
  minPrice: number;
  maxPrice: number;
  country: string;
  city: string;
  postalCode: string;
  street: string;
  houseNumber: string;
  phoneNumber: string;
  instagram?: string;
  facebook?: string;
  tiktok?: string;
  mainPicture?: string;
};

const schema = yup.object().shape({
  name: yup.string().required('A név megadása kötelező'),
  email: yup.string().email('Érvénytelen email cím').required('Az email cím megadása kötelező'),
  category: yup.string().oneOf(categories).required('A kategória kiválasztása kötelező'),
  minPrice: yup.number().required('A minimum ár megadása kötelező').min(0),
  maxPrice: yup.number().required('A maximum ár megadása kötelező').min(0)
    .test('max', 'A maximum árnak nagyobbnak kell lennie a minimum árnál', function(value) {
      return value > this.parent.minPrice;
    }),
  country: yup.string().required('Az ország megadása kötelező'),
  city: yup.string().required('A város megadása kötelező'),
  postalCode: yup.string().required('Az irányítószám megadása kötelező'),
  street: yup.string().required('Az utca megadása kötelező'),
  houseNumber: yup.string().required('A házszám megadása kötelező'),
  phoneNumber: yup.string().required('A telefonszám megadása kötelező'),
  instagram: yup.string().optional().nullable(),
  facebook: yup.string().optional().nullable(),
  tiktok: yup.string().optional().nullable(),
  mainPicture: yup.string().optional().nullable(),
}) as yup.ObjectSchema<FormValues>;

export default function RegistrationForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [videos, setVideos] = useState<File[]>([]);
  const [mainPicture, setMainPicture] = useState<File | null>(null);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [videoPreviewUrls, setVideoPreviewUrls] = useState<string[]>([]);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: yupResolver(schema)
  });

  const onImageDrop = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif']
    },
    maxFiles: 10,
    maxSize: 5 * 1024 * 1024, // 5MB
    onDrop: acceptedFiles => {
      const validFiles = acceptedFiles.filter(file => 
        validateFileSize(file, 5) && 
        validateFileType(file, ['image/jpeg', 'image/png', 'image/gif'])
      );
      setImages(prev => [...prev, ...validFiles].slice(0, 10));
    }
  });

  const onVideoDrop = useDropzone({
    accept: {
      'video/*': ['.mp4', '.mov', '.avi']
    },
    maxFiles: 3,
    maxSize: 25 * 1024 * 1024, // 25MB
    onDrop: acceptedFiles => {
      const validFiles = acceptedFiles.filter(file => 
        validateFileSize(file, 25) && 
        validateFileType(file, ['video/mp4', 'video/quicktime', 'video/x-msvideo'])
      );
      setVideos(prev => [...prev, ...validFiles].slice(0, 3));
    }
  });

  useEffect(() => {
    const urls = images.map(file => URL.createObjectURL(file));
    setPreviewUrls(urls);

    return () => {
      urls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [images]);

  useEffect(() => {
    const urls = videos.map(file => URL.createObjectURL(file));
    setVideoPreviewUrls(urls);

    return () => {
      urls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [videos]);

  const setMainPictureHandler = (file: File) => {
    setMainPicture(file);
  };

  const removeVideo = (index: number) => {
    setVideos(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = handleSubmit(async (data: FormValues) => {
    try {
      setIsSubmitting(true);
      setError(null);

      // Upload media files
      const imageUrls = await uploadMultipleFiles(images, 'images');
      const videoUrls = await uploadMultipleFiles(videos, 'videos');

      // Find the index of the main picture
      const mainPictureIndex = mainPicture ? images.indexOf(mainPicture) : -1;

      // Format media data according to the Provider model schema
      const formattedMedia = {
        images: imageUrls.map((url, index) => ({
          url,
          isMain: index === mainPictureIndex
        })),
        videos: videoUrls
      };

      // Submit form data with media URLs
      const response = await fetch('/api/providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          media: formattedMedia
        })
      });

      if (!response.ok) {
        throw new Error('A regisztráció sikertelen volt');
      }

      setSuccess(true);
      reset();
      setImages([]);
      setVideos([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Hiba történt');
    } finally {
      setIsSubmitting(false);
    }
  });

  if (success) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-green-600 mb-4">Sikeres regisztráció!</h2>
        <p className="text-gray-600">Köszönjük a regisztrációt. Hamarosan felvesszük Önnel a kapcsolatot.</p>
        <button
          onClick={() => setSuccess(false)}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Új regisztráció
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-black">Szépségipari Szolgáltató Regisztráció</h2>
      
      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Név</label>
          <input
            type="text"
            {...register('name')}
            placeholder="Adja meg a teljes nevét"
            className="mt-1 p-2 text-black block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            {...register('email')}
            placeholder="pelda@email.hu"
            className="mt-1 p-2 text-black block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Kategória</label>
          <select
            {...register('category')}
            className="mt-1 p-2 text-black block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">Válasszon kategóriát</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Minimum ár</label>
            <input
              type="number"
              {...register('minPrice')}
              placeholder="Pl.: 5000"
              className="mt-1 p-2 text-black block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            {errors.minPrice && <p className="mt-1 text-sm text-red-600">{errors.minPrice.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Maximum ár</label>
            <input
              type="number"
              {...register('maxPrice')}
              placeholder="Pl.: 15000"
              className="mt-1 p-2 text-black block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            {errors.maxPrice && <p className="mt-1 text-sm text-red-600">{errors.maxPrice.message}</p>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Ország</label>
          <input
            type="text"
            {...register('country')}
            placeholder="Pl.: Magyarország"
            className="mt-1 p-2 text-black block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          {errors.country && <p className="mt-1 text-sm text-red-600">{errors.country.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Város</label>
          <input
            type="text"
            {...register('city')}
            placeholder="Pl.: Budapest"
            className="mt-1 p-2 text-black block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          {errors.city && <p className="mt-1 text-sm text-red-600">{errors.city.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Irányítószám</label>
          <input
            type="text"
            {...register('postalCode')}
            placeholder="Pl.: 1051"
            className="mt-1 p-2 text-black block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          {errors.postalCode && <p className="mt-1 text-sm text-red-600">{errors.postalCode.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Utca</label>
            <input
              type="text"
              {...register('street')}
              placeholder="Pl.: Váci utca"
              className="mt-1 p-2 text-black block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            {errors.street && <p className="mt-1 text-sm text-red-600">{errors.street.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Házszám</label>
            <input
              type="text"
              {...register('houseNumber')}
              placeholder="Pl.: 12"
              className="mt-1 p-2 text-black block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            {errors.houseNumber && <p className="mt-1 text-sm text-red-600">{errors.houseNumber.message}</p>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Telefonszám</label>
          <input
            type="tel"
            {...register('phoneNumber')}
            placeholder="Pl.: +36 20 123 4567"
            className="mt-1 p-2 text-black block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          {errors.phoneNumber && <p className="mt-1 text-sm text-red-600">{errors.phoneNumber.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Instagram link</label>
          <input
            type="text"
            {...register('instagram')}
            placeholder="Pl.: @felhasznalonev"
            className="mt-1 p-2 text-black block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Facebook link</label>
          <input
            type="text"
            {...register('facebook')}
            placeholder="Pl.: facebook.com/felhasznalonev"
            className="mt-1 p-2 text-black block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">TikTok link</label>
          <input
            type="text"
            {...register('tiktok')}
            placeholder="Pl.: tiktok.com/@felhasznalonev"
            className="mt-1 p-2 text-black block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        {/* <div className="col-span-6 sm:col-span-3">
          <label className="block text-sm font-medium text-gray-700">TikTok link</label>
          <input
            type="text"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            {...register('tiktok')}
            placeholder="Pl.: tiktok.com/@felhasznalonev"
          />
        </div> */}

      </div>

      <div className="mt-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Képek (max 10, egyenként 5MB)</label>
        <div
          {...onImageDrop.getRootProps()}
          className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 transition-colors"
        >
          <input {...onImageDrop.getInputProps()} />
          {images.length === 0 ? (
            <div className="flex flex-col items-center gap-2">
              <svg 
                className="w-12 h-12 text-gray-400" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="2" 
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <p className="text-gray-600">
                Húzza ide a képeket vagy kattintson a kiválasztáshoz
              </p>
              <p className="text-sm text-gray-500">
                Támogatott formátumok: JPG, PNG, GIF (max. 5MB)
              </p>
            </div>
          ) : (
            <p className="text-gray-600">
              {images.length} kép kiválasztva
            </p>
          )}
        </div>

        {images.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-700">Képek előnézete</p>
              <p className="text-sm text-gray-500">
                {10 - images.length} kép feltölthető még
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {images.map((file, index) => (
                <div key={index} className="relative">
                  <div className="relative w-full h-48">
                    <Image
                      src={previewUrls[index]}
                      alt={`Preview ${index + 1}`}
                      fill
                      className="object-contain"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      type="radio"
                      id={`main-picture-${index}`}
                      name="mainPicture"
                      checked={mainPicture === file}
                      onChange={() => setMainPictureHandler(file)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <label
                      htmlFor={`main-picture-${index}`}
                      className="text-sm text-gray-700 cursor-pointer"
                    >
                      Fő kép
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Videók (max 3, egyenként 25MB)</label>
        <div
          {...onVideoDrop.getRootProps()}
          className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 transition-colors"
        >
          <input {...onVideoDrop.getInputProps()} />
          {videos.length === 0 ? (
            <div className="flex flex-col items-center gap-2">
              <svg 
                className="w-12 h-12 text-gray-400" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="2" 
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              <p className="text-gray-600">
                Húzza ide a videókat vagy kattintson a kiválasztáshoz
              </p>
              <p className="text-sm text-gray-500">
                Támogatott formátumok: MP4, MOV, AVI (max. 25MB)
              </p>
            </div>
          ) : (
            <p className="text-gray-600">
              {videos.length} videó kiválasztva
            </p>
          )}
        </div>

        {videos.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-700">Videók előnézete</p>
              <p className="text-sm text-gray-500">
                {3 - videos.length} videó feltölthető még
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {videos.map((file, index) => (
                <div key={index} className="relative">
                  <div className="aspect-video relative bg-gray-100 rounded-lg overflow-hidden">
                    <video
                      src={videoPreviewUrls[index]}
                      className="w-full h-full object-contain"
                      controls
                    />
                    <button
                      type="button"
                      onClick={() => removeVideo(index)}
                      className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                      title="Videó törlése"
                    >
                      ×
                    </button>
                  </div>
                  <p className="mt-2 text-sm text-gray-600 truncate">
                    {file.name}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-6">
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {isSubmitting ? 'Feldolgozás...' : 'Regisztráció beküldése'}
        </button>
      </div>
    </form>
  );
} 