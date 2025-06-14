import mongoose, { Schema, Document } from 'mongoose';

export interface IProvider extends Document {
  name: string;
  email: string;
  category: string;
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
  tiktok: string;
  media: {
    images: Array<{
      url: string;
      isMain: boolean;
    }>;
    videos: Array<{
      url: string;
      isMain: boolean;
    }>;
  };
  success: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ProviderSchema: Schema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: false },
  category: { 
    type: String, 
    required: true,
    enum: [
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
      'Pedikür',
      'Fitness/mozgás'
    ]
  },
  minPrice: { type: Number, required: true },
  maxPrice: { type: Number, required: true },
  country: { type: String, required: true },
  city: { type: String, required: true },
  postalCode: { type: String, required: true },
  street: { type: String, required: true },
  houseNumber: { type: String, required: true },
  phoneNumber: { type: String },
  instagram: { type: String },
  facebook: { type: String },
  tiktok: { type: String },
  media: {
    images: [{
      url: { type: String, required: true },
      isMain: { type: Boolean, default: false }
    }],
    videos: [{ type: String }]
  },
  success: { type: Boolean, default: false },
}, {
  timestamps: true
});

export default mongoose.models.Provider || mongoose.model<IProvider>('Provider', ProviderSchema); 