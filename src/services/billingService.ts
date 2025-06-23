import axios from 'axios'
import { API_BASE_URL } from '../config';
import type { InvoiceApiResponse, InvoiceFilters, InvoiceResponse } from '../types/invoices'
import type { TicketFilters, TicketsApiResponse, TicketsApiResponseData } from '../types/tickets'

export async function getInvoices(
  filters: InvoiceFilters,
  token: string
): Promise<InvoiceApiResponse> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };

  // Construire params en n'incluant que les champs réellement définis
  const params: Record<string, string | number> = {}

  // status : on inclut uniquement si non vide
  if (filters.status) {
    params.status = filters.status;
  }
  // date_from : on inclut uniquement si non vide, et potentiellement valider le format YYYY-MM-DD
  if (filters.date_from && filters.date_from.trim() !== '') {
    params.date_from = filters.date_from
  }
  // date_to
  if (filters.date_to && filters.date_to.trim() !== '') {
    params.date_to = filters.date_to
  }
  // sort_by, sort_order, per_page, page : ces champs ont toujours une valeur par défaut, on les inclut toujours
  params.sort_by = filters.sort_by
  params.sort_order = filters.sort_order
  params.per_page = filters.per_page
  params.page = filters.page

  // Si tu souhaites passer lang pour Accept-Language, tu peux le faire ici ou dans l’appel axios plus haut
  // headers['Accept-Language'] = lang;

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
 * Télécharge la facture identifiée par invoice_link.
 * @param invoice_link Nom du fichier ou identifiant fourni par l'API.
 * @param token Bearer token pour l'authentification.
 * @returns Le Blob du PDF de la facture.
 * @throws Une erreur si la requête échoue.
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
 * Récupère la liste paginée des tickets de l’utilisateur.
 * @param filters Filtres de recherche / pagination.
 * @param token Token Bearer pour l’Authorization.
 * @returns Promise de TicketsApiResponse (status + data).
 * @throws Erreur si la requête échoue.
 */
export async function getUserTickets(
  filters: TicketFilters,
  token: string
): Promise<TicketsApiResponse> {
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${token}`,
    // Pas de 'Content-Type' pour GET sans body.
    'Accept': 'application/json',
  };

  // Construire params en n’incluant que les champs définis et non vides.
  const params: Record<string, string | number> = {};

  // q (recherche texte) : inclure uniquement si non vide
  if (filters.status) {
    params.status = filters.status;
  }
  // per_page et page : toujours inclus (valeurs par défaut dans l’UI ou appelant)
  params.per_page = filters.per_page;
  params.page = filters.page;

  // event_date_from : inclure si non vide
  if (filters.event_date_from && filters.event_date_from.trim() !== '') {
    params.event_date_from = filters.event_date_from.trim();
  }
  // event_date_to
  if (filters.event_date_to && filters.event_date_to.trim() !== '') {
    params.event_date_to = filters.event_date_to.trim();
  }

  // Appel GET
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
 * Récupère le PDF du billet en tant que Blob.
 * @param rawPdfFilename Chaîne potentiellement avec chemin, ex. "/storage/tickets/ticket_abc123.pdf"
 * @param token Token Bearer
 * @returns Blob contenant le PDF
 */
export async function getUserTicketPdf(
  rawPdfFilename: string,
  token: string
): Promise<Blob> {
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
 * Récupère le QR code d’un ticket en tant que Blob (PNG).
 * @param qrFilename Nom du fichier QR (ex. "qr_abc123.png")
 * @param token Token Bearer pour l’Authorization
 * @returns Blob contenant l’image PNG
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