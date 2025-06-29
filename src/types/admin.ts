import type { ProductDetails } from './products';

export type LanguageCode = 'fr' | 'en' | 'de';

export interface TranslationEntry {
  name: string;
  product_details: {
    places: number;
    description: string;
    date: string;
    time: string;
    location: string;
    category: string;
    image: string;
    imageFile?: File;
  };
}

export interface Translation {
  name: string;
  product_details: ProductDetails;
}

export interface AdminProduct {
  id: number;
  price: number;
  sale: number;
  stock_quantity: number;
  // champs « actifs » pour la langue sélectionnée
  name: string;
  product_details: ProductDetails;
  // toutes les traductions récupérées depuis l’API
  translations: {
    fr: Translation;
    en: Translation;
    de: Translation;
  };
}

export interface ProductFormData {
  price: number;
  sale: number;
  stock_quantity: number;
  imageFile?: File;
  translations: Record<LanguageCode, TranslationEntry>;
}