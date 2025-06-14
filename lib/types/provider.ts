export type MediaItem = string | { url: string; isMain: boolean };

export type Provider = {
  _id: string;
  name: string;
  category: string;
  phoneNumber: string;
  houseNumber: string;
  street: string;
  postalCode: string;
  city: string;
  country: string;
  maxPrice: number;
  minPrice: number;
  email: string;
  createdAt: Date;
  updatedAt: Date;
  instagram?: string;
  facebook?: string;
  tiktok?: string;
  media: {
    images: MediaItem[];
    videos: MediaItem[];
  };
  success?: boolean;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode?: string;
  };
}; 