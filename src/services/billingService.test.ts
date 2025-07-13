import axios from 'axios'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import {
  getInvoices,
  getUserInvoice,
  getUserTickets,
  getUserTicketPdf,
  getUserQr,
  getAdminInvoice,
  getAdminTicketPdf,
  getAdminQr,
} from './billingService'
import { API_BASE_URL } from '../config'
import type { InvoiceFilters } from '../types/invoices'
import type { TicketFilters } from '../types/tickets'
// Mock axios
vi.mock('axios')
const mockedAxios = axios as jest.Mocked<typeof axios>

describe('API helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getInvoices', () => {
    it('should call axios.get with correct params when filters empty', async () => {
      mockedAxios.get.mockResolvedValueOnce({ status: 200, data: {} })
      const filters = {
        status:    '',
        date_from: '',
        date_to:   '',
        sort_by:   'created_at',
        sort_order:'desc',
        per_page:  10,
        page:      2,
      } as InvoiceFilters

      await getInvoices(filters, 'tok')

      expect(mockedAxios.get).toHaveBeenCalledWith(
        `${API_BASE_URL}/api/invoices`,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer tok`,
          },
          // seuls les champs obligatoires / non vides doivent apparaître :
          params: {
            sort_by:    'created_at',
            sort_order: 'desc',
            per_page:   10,
            page:       2,
          },
        }
      )
    })

    it('should include optional filters when provided', async () => {
      mockedAxios.get.mockResolvedValueOnce({ status: 201, data: {} })
      const filters = {
        status:     'paid',          // valeur InvoiceStatus valide
        date_from:  '2025-01-01',
        date_to:    '2025-02-01',
        sort_by:    'created_at',
        sort_order: 'asc',
        per_page:   5,
        page:       1,
      } as InvoiceFilters

      await getInvoices(filters, 'tok')

      expect(mockedAxios.get).toHaveBeenCalledWith(
        `${API_BASE_URL}/api/invoices`,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer tok`,
          },
          // maintenant on s’attend à tous les filtres activés :
          params: {
            status:     'paid',
            date_from:  '2025-01-01',
            date_to:    '2025-02-01',
            sort_by:    'created_at',
            sort_order: 'asc',
            per_page:   5,
            page:       1,
          },
        }
      )
    })
  })

  describe('getUserInvoice', () => {
    it('should return blob when status 200', async () => {
      const blob = new Blob(['pdf content'], { type: 'application/pdf' })
      mockedAxios.get.mockResolvedValueOnce({ status: 200, data: blob })

      const invoice_link = 'inv123.pdf'
      const token = 'tok'
      const result = await getUserInvoice(invoice_link, token)

      expect(mockedAxios.get).toHaveBeenCalledWith(
        `${API_BASE_URL}/api/invoices/${encodeURIComponent(invoice_link)}`,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            Accept: 'application/pdf',
          },
          responseType: 'blob',
        }
      )
      expect(result).toBe(blob)
    })

    it('should throw error on non-200', async () => {
      mockedAxios.get.mockResolvedValueOnce({ status: 404, data: new Blob() })

      await expect(getUserInvoice('inv.pdf', 'tok')).rejects.toThrow(
        'Error while downloading invoice: HTTP 404'
      )
    })
  })

  describe('getUserTickets', () => {
    it('should call axios.get with basic params', async () => {
      mockedAxios.get.mockResolvedValueOnce({ status: 200, data: {} })
      const filters = {
        status:           '',
        per_page:         3,
        page:             4,
        event_date_from:  '',
        event_date_to:    '',
      } as TicketFilters

      await getUserTickets(filters, 'tok2')

      expect(mockedAxios.get).toHaveBeenCalledWith(
        `${API_BASE_URL}/api/tickets/user`,
        {
          headers: {
            Authorization: `Bearer tok2`,
            Accept:        'application/json',
          },
          params: {
            per_page: 3,
            page:     4,
          },
        }
      )
    })

    it('should include optional ticket filters', async () => {
      mockedAxios.get.mockResolvedValueOnce({ status: 201, data: {} })
      const filters = {
        status:           'used',
        per_page:         2,
        page:             1,
        event_date_from:  '2025-03-01',
        event_date_to:    '2025-04-01',
      } as TicketFilters

      await getUserTickets(filters, 'tok3')

      expect(mockedAxios.get).toHaveBeenCalledWith(
        `${API_BASE_URL}/api/tickets/user`,
        {
          headers: {
            Authorization: `Bearer tok3`,
            Accept:        'application/json',
          },
          params: {
            status:           'used',
            per_page:         2,
            page:             1,
            event_date_from:  '2025-03-01',
            event_date_to:    '2025-04-01',
          },
        }
      )
    })
  })

  describe('getUserTicketPdf', () => {
    it('should throw if filename invalid', async () => {
      await expect(getUserTicketPdf('/path/to/', 'tok')).rejects.toThrow(
        'Invalid filename: "/path/to/"'
      )
    })

    it('should return blob for valid filename and status 200', async () => {
      const blob = new Blob(['pdf'], { type: 'application/pdf' })
      mockedAxios.get.mockResolvedValueOnce({ status: 200, data: blob })

      const result = await getUserTicketPdf('ticket123.pdf', 'tok4')
      expect(mockedAxios.get).toHaveBeenCalledWith(
        `${API_BASE_URL}/api/tickets/ticket123.pdf`,
        {
          headers: { Authorization: `Bearer tok4`, Accept: 'application/pdf' },
          responseType: 'blob',
        }
      )
      expect(result).toBe(blob)
    })

    it('should throw on non-200 status', async () => {
      mockedAxios.get.mockResolvedValueOnce({ status: 500, data: new Blob() })
      await expect(getUserTicketPdf('ticket.pdf', 'tok')).rejects.toThrow('HTTP 500')
    })
  })

  describe('getUserQr', () => {
    it('should return blob for valid QR', async () => {
      const qr = new Blob(['png'], { type: 'image/png' })
      mockedAxios.get.mockResolvedValueOnce({ status: 200, data: qr })

      const result = await getUserQr('qr.png', 'tok5')
      expect(mockedAxios.get).toHaveBeenCalledWith(
        `${API_BASE_URL}/api/tickets/qr/qr.png`,
        {
          headers: { Authorization: `Bearer tok5`, Accept: 'image/png' },
          responseType: 'blob',
        }
      )
      expect(result).toBe(qr)
    })

    it('should throw on non-200 status', async () => {
      mockedAxios.get.mockResolvedValueOnce({ status: 404, data: new Blob() })
      await expect(getUserQr('qr.png', 'tok')).rejects.toThrow('HTTP 404')
    })
  })
})

describe('admin endpoints', () => {
  describe('getAdminInvoice', () => {
    it('downloads admin invoice when status 200', async () => {
      const blob = new Blob(['pdf'], { type: 'application/pdf' })
      mockedAxios.get.mockResolvedValueOnce({ status: 200, data: blob })

      const invoiceLink = 'admin_inv.pdf'
      const token = 'admintok'
      const result = await getAdminInvoice(invoiceLink, token)

      expect(mockedAxios.get).toHaveBeenCalledWith(
        `${API_BASE_URL}/api/invoices/admin/${encodeURIComponent(invoiceLink)}`,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            Accept: 'application/pdf',
          },
          responseType: 'blob',
        }
      )
      expect(result).toBe(blob)
    })

    it('throws on non-200 status', async () => {
      mockedAxios.get.mockResolvedValueOnce({ status: 403, data: new Blob() })
      await expect(getAdminInvoice('foo.pdf', 'tok')).rejects.toThrow(
        'Error while downloading invoice: HTTP 403'
      )
    })
  })

  describe('getAdminTicketPdf', () => {
    it('throws if rawPdfFilename has no basename', async () => {
      await expect(getAdminTicketPdf('/some/path/', 'tok')).rejects.toThrow(
        'Invalid filename: "/some/path/"'
      )
    })

    it('downloads admin ticket PDF when status 200', async () => {
      const blob = new Blob(['ticket'], { type: 'application/pdf' })
      mockedAxios.get.mockResolvedValueOnce({ status: 200, data: blob })

      const result = await getAdminTicketPdf('/var/tmp/tk.pdf', 'admintok')
      expect(mockedAxios.get).toHaveBeenCalledWith(
        `${API_BASE_URL}/api/tickets/admin/${encodeURIComponent('tk.pdf')}`,
        {
          headers: { Authorization: `Bearer admintok`, Accept: 'application/pdf' },
          responseType: 'blob',
        }
      )
      expect(result).toBe(blob)
    })

    it('throws when status is not 200', async () => {
      mockedAxios.get.mockResolvedValueOnce({ status: 500, data: new Blob() })
      await expect(getAdminTicketPdf('file.pdf', 'tok')).rejects.toThrow('HTTP 500')
    })
  })

  describe('getAdminQr', () => {
    it('downloads admin QR blob when status 200', async () => {
      const qr = new Blob(['png'], { type: 'image/png' })
      mockedAxios.get.mockResolvedValueOnce({ status: 200, data: qr })

      const result = await getAdminQr('code.png', 'admintok2')
      expect(mockedAxios.get).toHaveBeenCalledWith(
        `${API_BASE_URL}/api/tickets/admin/qr/${encodeURIComponent('code.png')}`,
        {
          headers: { Authorization: `Bearer admintok2`, Accept: 'image/png' },
          responseType: 'blob',
        }
      )
      expect(result).toBe(qr)
    })

    it('throws when server returns non-200', async () => {
      mockedAxios.get.mockResolvedValueOnce({ status: 404, data: new Blob() })
      await expect(getAdminQr('notfound.png', 'tok')).rejects.toThrow('HTTP 404')
    })
  })
})