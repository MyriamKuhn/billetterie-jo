/**
 * Statut possible d’un ticket.
 * Exemple : "issued", "used", "refunded", "cancelled", etc.
 * Adaptez selon la documentation backend (ici on a vu "issued").
 */
export type TicketStatus = '' | 'issued' | 'used' | 'refunded' | 'cancelled';

/**
 * Représentation d’un ticket renvoyé par l’API.
 * Exemple basé sur la réponse fournie :
 * {
 *   id: number,
 *   token: string,
 *   payment_uuid: string,
 *   product_snapshot: { ... },
 *   status: string,
 *   used_at: string | null,
 *   refunded_at: string | null,
 *   cancelled_at: string | null,
 *   qr_filename: string,
 *   pdf_filename: string
 * }
 */
export interface Ticket {
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
}

/**
 * Filtres pour l’appel /api/tickets/user
 * - q: recherche par nom de produit (optionnel)
 * - per_page: nombre d’items par page (1–100), défaut 25
 * - page: numéro de page, défaut 1
 * - event_date_from: filtre date d’événement >= (YYYY-MM-DD)
 * - event_date_to: filtre date d’événement <= (YYYY-MM-DD)
 * On peut utiliser string vide ou undefined pour absence de filtre. Ici on rend les champs optionnels ou avec type incluant ''.
 */
export interface TicketFilters {
  status: TicketStatus;
  per_page: number;
  page: number;
  event_date_from?: string;
  event_date_to?: string;
}

/**
 * Méta-données de pagination renvoyées par l’API tickets.
 * Exemple :
 * "meta": {
 *   "current_page": 0,
 *   "last_page": 0,
 *   "per_page": 0,
 *   "total": 0
 * }
 * Ajustez selon la structure exacte.
 */
export interface TicketResponseMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  [key: string]: any;
}

/**
 * Structure de la réponse de l’API tickets.
 */
export interface TicketsApiResponseData {
  data: Ticket[];
  meta: TicketResponseMeta;
  // s’il y a liens, ajoutez ici, ex. links?: { next?: string; prev?: string; [key:string]: any }
  [key: string]: any;
}

export interface TicketsApiResponse {
  status: number;
  data: TicketsApiResponseData;
}
