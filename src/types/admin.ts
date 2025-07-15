import type { ProductDetails } from './products';
import type { TicketStatus } from './tickets';

/** ISO language codes supported by the application */
export type LanguageCode = 'fr' | 'en' | 'de';

/** Raw entry for a translation before form submission */
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

/** A fully parsed translation for a given language */
export interface Translation {
  name: string;
  product_details: ProductDetails;
}

/** Represents a product in the admin catalog, including all translations */
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

/** Payload for creating or updating a product via form data */
export interface ProductFormData {
  price: number;
  sale: number;
  stock_quantity: number;
  imageFile?: File;
  translations: Record<LanguageCode, TranslationEntry>;
}

/** Possible statuses for an administrator-triggered payment */
export type AdminPaymentsStatus = 'pending' | 'paid' | 'failed' | 'refunded' | '';

/** Represents a payment record in the admin panel */
export interface AdminPayments {
  uuid: string;
  invoice_link: string;
  cart_snapshot: [
    {
      product_id: number;
      product_name: string;
      ticket_type: string;
      ticket_places: number;
      quantity: number;
      unit_price: number;
      discount_rate: number;
      discounted_price: number;
    }
  ]
  amount: number;
  payment_method: 'paypal' | 'stripe' | 'free';
  status: AdminPaymentsStatus;
  transaction_id: string | null;
  paid_at: string | null;
  refunded_at: string | null;
  refunded_amount: number | null;
  user: {
    id: number;
    email: string;
  };
  created_at: string;
  updated_at: string;
}

/** Represents a ticket record in the admin panel */
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

/** Filters available for the admin tickets list */
export interface AdminTicketFilters {
  status: TicketStatus;
  user_id?: number;
  per_page: number;
  page: number;
}

/** Filters available for the admin payments list */
export interface AdminPaymentFilters {
  q: string;
  status: AdminPaymentsStatus;
  payment_method: 'paypal' | 'stripe' | 'free' | '';
  per_page: number;
  page: number;
}

/** Entry for product sales report */
export interface ReportProductSales {
  product_id: number;
  product_name: string;
  sales_count: number;
}

/** Response shape for reports API (list of product sales) */
export interface AdminReportsResponse {
  data: ReportProductSales[];
}

/** Filters available for the admin reports list */
export interface AdminReportsFilters {
  sort_by: 'sales_count';
  sort_order: 'asc' | 'desc';
  per_page: number;
  page: number;
}