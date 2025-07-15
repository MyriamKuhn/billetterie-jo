import axios from 'axios'
import { API_BASE_URL } from '../config';
import type { InvoiceApiResponse, InvoiceFilters, InvoiceResponse } from '../types/invoices'
import type { TicketFilters, TicketsApiResponse, TicketsApiResponseData } from '../types/tickets'

/**
 * Fetch a paginated list of invoices according to the given filters.
 * Only non‑empty filter fields are included in the query parameters.
 *
 * @param filters  Filtering and pagination options
 * @param token    Bearer token for authentication
 * @returns        An object with HTTP status and parsed response data
 */
export async function getInvoices(
  filters: InvoiceFilters,
  token: string
): Promise<InvoiceApiResponse> {
  // Common headers with JSON content type and auth
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };

  // Build query params, including only non‑empty values
  const params: Record<string, string | number> = {}

  if (filters.status) {
    params.status = filters.status;
  }
  if (filters.date_from && filters.date_from.trim() !== '') {
    params.date_from = filters.date_from
  }
  if (filters.date_to && filters.date_to.trim() !== '') {
    params.date_to = filters.date_to
  }
  // Always include pagination and sort defaults
  params.sort_by = filters.sort_by
  params.sort_order = filters.sort_order
  params.per_page = filters.per_page
  params.page = filters.page

  // Execute the GET request
  const response = await axios.get<InvoiceResponse>(
    `${API_BASE_URL}/api/invoices`, 
    { headers, params }
  );
  
  return {
    status: response.status,
    data: response.data,
  };
}

/**
 * Download a user invoice as a PDF blob.
 *
 * @param invoice_link  Identifier or filename for the invoice
 * @param token         Bearer token for authentication
 * @returns             The PDF blob
 * @throws              Error if the HTTP status is not 200
 */
export async function getUserInvoice(
  invoice_link: string,
  token: string
): Promise<Blob> {
  const url = `${API_BASE_URL}/api/invoices/${encodeURIComponent(invoice_link)}`

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/pdf',
  };  

  const response = await axios.get(url, {
    headers,
    responseType: 'blob',
  })

  if (response.status !== 200) {
    throw new Error(`Error while downloading invoice: HTTP ${response.status}`)
  }
  
  return response.data
}

/**
 * Download a admin invoice as a PDF blob.
 *
 * @param invoice_link  Identifier or filename for the invoice
 * @param token         Bearer token for authentication
 * @returns             The PDF blob
 * @throws              Error if the HTTP status is not 200
 */
export async function getAdminInvoice(
  invoice_link: string,
  token: string
): Promise<Blob> {
  const url = `${API_BASE_URL}/api/invoices/admin/${encodeURIComponent(invoice_link)}`

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/pdf',
  };  

  const response = await axios.get(url, {
    headers,
    responseType: 'blob',
  })

  if (response.status !== 200) {
    throw new Error(`Error while downloading invoice: HTTP ${response.status}`)
  }
  
  return response.data
}
  
/**
 * Fetch a paginated list of the current user’s tickets.
 * Only non‑empty filter fields are added to the query.
 *
 * @param filters  Filtering and pagination options
 * @param token    Bearer token for authentication
 * @returns        An object with HTTP status and parsed response data
 */
export async function getUserTickets(
  filters: TicketFilters,
  token: string
): Promise<TicketsApiResponse> {
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/json',
  };

  // Build query params, including only non‑empty values
  const params: Record<string, string | number> = {};

  if (filters.status) {
    params.status = filters.status;
  }
  // Always include pagination
  params.per_page = filters.per_page;
  params.page = filters.page;

  if (filters.event_date_from && filters.event_date_from.trim() !== '') {
    params.event_date_from = filters.event_date_from.trim();
  }
  if (filters.event_date_to && filters.event_date_to.trim() !== '') {
    params.event_date_to = filters.event_date_to.trim();
  }

  // Execute the GET request
  const response = await axios.get<TicketsApiResponseData>(
    `${API_BASE_URL}/api/tickets/user`,
    {
      headers,
      params,
    }
  );

  return {
    status: response.status,
    data: response.data,
  };
}

/**
 * Download a user ticket PDF as a blob.
 *
 * @param rawPdfFilename  The raw filename (may include a path)
 * @param token           Bearer token for authentication
 * @returns               The PDF blob
 * @throws                Error if filename is invalid or HTTP fails
 */
export async function getUserTicketPdf(
  rawPdfFilename: string,
  token: string
): Promise<Blob> {
  // Strip any directory path
  const filename = rawPdfFilename.replace(/^.*[\\/]/, '')

  if (!filename) {
    throw new Error(`Invalid filename: "${rawPdfFilename}"`)
  }
  
  const url = `${API_BASE_URL}/api/tickets/${encodeURIComponent(filename)}`
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/pdf',
  }
  const response = await axios.get(url, {
    headers,
    responseType: 'blob',
  })
  if (response.status !== 200) {
    throw new Error(`HTTP ${response.status}`)
  }
  return response.data
}

/**
 * Download a admin ticket PDF as a blob.
 *
 * @param rawPdfFilename  The raw filename (may include a path)
 * @param token           Bearer token for authentication
 * @returns               The PDF blob
 * @throws                Error if filename is invalid or HTTP fails
 */
export async function getAdminTicketPdf(
  rawPdfFilename: string,
  token: string
): Promise<Blob> {
  const filename = rawPdfFilename.replace(/^.*[\\/]/, '')

  if (!filename) {
    throw new Error(`Invalid filename: "${rawPdfFilename}"`)
  }
  
  const url = `${API_BASE_URL}/api/tickets/admin/${encodeURIComponent(filename)}`
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/pdf',
  }
  const response = await axios.get(url, {
    headers,
    responseType: 'blob',
  })
  if (response.status !== 200) {
    throw new Error(`HTTP ${response.status}`)
  }
  return response.data
}

/**
 * Retrieves the QR code for a user ticket as a Blob (PNG).
 * @param qrFilename Filename of the QR code (e.g. "qr_abc123.png")
 * @param token Token Bearer for Authorization
 * @returns   Blob containing the PNG image
 */
export async function getUserQr(
  qrFilename: string,
  token: string
): Promise<Blob> {
  const url = `${API_BASE_URL}/api/tickets/qr/${encodeURIComponent(qrFilename)}`
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${token}`,
    'Accept': 'image/png',
  }
  const response = await axios.get(url, {
    headers,
    responseType: 'blob',
  })
  if (response.status !== 200) {
    throw new Error(`HTTP ${response.status}`)
  }
  return response.data
}

/**
 * Retrieves the QR code for a admin ticket as a Blob (PNG).
 * @param qrFilename Filename of the QR code (e.g. "qr_abc123.png")
 * @param token Token Bearer for Authorization
 * @returns   Blob containing the PNG image
 */
export async function getAdminQr(
  qrFilename: string,
  token: string
): Promise<Blob> {
  const url = `${API_BASE_URL}/api/tickets/admin/qr/${encodeURIComponent(qrFilename)}`
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${token}`,
    'Accept': 'image/png',
  }
  const response = await axios.get(url, {
    headers,
    responseType: 'blob',
  })
  if (response.status !== 200) {
    throw new Error(`HTTP ${response.status}`)
  }
  return response.data
}