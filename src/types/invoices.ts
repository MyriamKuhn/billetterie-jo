/**
 * Possible statuses for an invoice.
 */
export type InvoiceStatus = '' | 'pending' | 'paid' | 'failed' | 'refunded'

/**
 * Represents a single invoice.
 */
export interface Invoice {
  uuid: string;
  amount: number;
  status: InvoiceStatus;
  created_at: string;       
  invoice_link: string;    
  download_url: string;     
}

/**
 * Filters, sorting, and pagination options when querying invoices.
 */
export interface InvoiceFilters {
  status: InvoiceStatus;
  date_from: string
  date_to: string
  sort_by: 'uuid' | 'amount' | 'created_at'
  sort_order: 'asc' | 'desc'
  per_page: number
  page: number
}

/**
 * Standard wrapper for responses from the invoices API.
 */
export interface InvoiceApiResponse {
  status: number;
  data: InvoiceResponse;
}

/**
 * Shape of the data returned when querying invoices.
 */
export interface InvoiceResponse {
  data: Invoice[]
  meta: {
    total: number
    per_page: number
    current_page: number
    last_page: number
  }
  links: {
    next?: string
    prev?: string
  }
}
