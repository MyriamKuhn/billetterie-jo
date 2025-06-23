// Statut possible d'une invoice
export type InvoiceStatus = '' | 'pending' | 'paid' | 'failed' | 'refunded'

// Représentation d'une facture (invoice)
export interface Invoice {
  uuid: string;
  amount: number;
  status: InvoiceStatus;
  created_at: string;       // ISO 8601
  invoice_link: string;    // Nom du fichier PDF
  download_url: string;     // URL de téléchargement
}

// Filtrage, tri et pagination des invoices
export interface InvoiceFilters {
  status: InvoiceStatus;
  date_from: string
  date_to: string
  sort_by: 'uuid' | 'amount' | 'created_at'
  sort_order: 'asc' | 'desc'
  per_page: number
  page: number
}

export interface InvoiceApiResponse {
  status: number;
  data: InvoiceResponse;
}

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
