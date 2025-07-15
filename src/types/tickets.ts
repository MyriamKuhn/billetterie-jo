/**
 * Possible statuses for a ticket.
 * Example values: "issued", "used", "refunded", "cancelled", etc.
 * Adjust according to your backend documentation.
 */
export type TicketStatus = '' | 'issued' | 'used' | 'refunded' | 'cancelled';

/**
 * Representation of a ticket returned by the API.
 * Example shape:
 * {
 *   id: number;
 *   token: string;
 *   payment_uuid: string;
 *   product_snapshot: { ... };
 *   status: TicketStatus;
 *   used_at: string | null;
 *   refunded_at: string | null;
 *   cancelled_at: string | null;
 *   qr_filename: string;
 *   pdf_filename: string;
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
 * Query parameters for fetching user tickets.
 * - status: filter by ticket status
 * - per_page: number of items per page
 * - page: page number
 * - event_date_from: ISO date string to filter events on or after this date (YYYY-MM-DD)
 * - event_date_to: ISO date string to filter events on or before this date (YYYY-MM-DD)
 */
export interface TicketFilters {
  status: TicketStatus;
  per_page: number;
  page: number;
  event_date_from?: string;
  event_date_to?: string;
}

/**
 * Pagination metadata returned by the tickets API.
 * Example:
 * {
 *   current_page: number;
 *   last_page: number;
 *   per_page: number;
 *   total: number;
 * }
 */
export interface TicketResponseMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  [key: string]: any;
}

/**
 * Full response payload from the tickets API.
 */
export interface TicketsApiResponseData {
  data: Ticket[];
  meta: TicketResponseMeta;
  // s’il y a liens, ajoutez ici, ex. links?: { next?: string; prev?: string; [key:string]: any }
  [key: string]: any;
}

/**
 * Wrapper for the tickets API response, including HTTP status.
 */
export interface TicketsApiResponse {
  status: number;
  data: TicketsApiResponseData;
}
