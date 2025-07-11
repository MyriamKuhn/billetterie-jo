import type { ProductDetails } from './products';
import type { TicketStatus } from './tickets';

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

export type AdminPaymentsStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface AdminTicket {
  id: number;
  token: string;
  payment_uuid: string;
  product_snapshot: {
    product_id: number;
    product_name: string;
    ticket_type: string;
    ticket_places: number;
    quantity: number;
    unit_price: number;
    discount_rate: number;
    discounted_price: number;
  };
  status: TicketStatus;
  used_at: string | null;
  refunded_at: string | null;
  cancelled_at: string | null;
  qr_filename: string;
  pdf_filename: string;
  user: {
    id: number;
    firstname: string;
    lastname: string;
    email: string
  };
  payment: {
    id: number;
    uuid: string;
    status: AdminPaymentsStatus;
  };
  created_at: string;
  updated_at: string;
}

export interface AdminTicketFilters {
  status: TicketStatus;
  user_id?: number;
  per_page: number;
  page: number;
}