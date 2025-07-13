import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { API_BASE_URL } from '../config';
import { useAdminReports, type Filters } from './useAdminReports';
import type { ReportProductSales } from '../types/admin';

// ─── Mock axios ────────────────────────────────────────────────────────────────
vi.mock('axios', () => ({
  __esModule: true,
  default: {
    get: vi.fn(),
    isAxiosError: (err: any): err is any => !!err.isAxiosError,
  },
}));
import axios from 'axios';
const mockedGet = (axios as any).get as Mock;

// ─── Test helper component ─────────────────────────────────────────────────────
function TestComponent(props: {
  filters: Filters;
  token: string;
  lang: string;
}) {
  const { reports, total, loading, error, validationErrors } =
    useAdminReports(props.filters, props.token, props.lang);

  return (
    <div>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="error">{error ?? ''}</span>
      <span data-testid="validation">
        {validationErrors ? JSON.stringify(validationErrors) : ''}
      </span>
      <span data-testid="total">{String(total)}</span>
      <span data-testid="reports">
        {reports.map(r => r.product_name).join(',')}
      </span>
    </div>
  );
}

// ─── Sample data & helper ─────────────────────────────────────────────────────
const exampleData: ReportProductSales[] = [
  { product_id: 1, product_name: 'Item A', sales_count: 3 },
];
const exampleMeta = { total: 42 };

function makeFilters(overrides?: Partial<Filters>): Filters {
  return {
    sort_by: 'sales_count',
    sort_order: 'desc',
    per_page: 10,
    page: 2,
    ...overrides,
  };
}

// ─── Tests ───────────────────────────────────────────────────────────────────────
describe('useAdminReports', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches successfully and updates state', async () => {
    mockedGet.mockResolvedValueOnce({
      data: { data: exampleData, meta: exampleMeta },
    });

    render(
      <TestComponent
        filters={makeFilters()}
        token="tok-123"
        lang="en"
      />
    );

    // loading starts à true
    expect(screen.getByTestId('loading')).toHaveTextContent('true');

    // puis à false
    await waitFor(() =>
      expect(screen.getByTestId('loading')).toHaveTextContent('false')
    );

    // & données à jour
    expect(screen.getByTestId('reports')).toHaveTextContent('Item A');
    expect(screen.getByTestId('total')).toHaveTextContent('42');
    expect(screen.getByTestId('error')).toHaveTextContent('');
    expect(screen.getByTestId('validation')).toHaveTextContent('');

    // vérifie l’appel axios
    expect(mockedGet).toHaveBeenCalledWith(
      `${API_BASE_URL}/api/tickets/admin/sales`,
      expect.objectContaining({
        params: {
          per_page: 10,
          page: 2,
          sort_by: 'sales_count',
          sort_order: 'desc',
        },
        headers: {
          Authorization: 'Bearer tok-123',
          'Accept-Language': 'en',
        },
      })
    );
  });

  it('enforces per_page minimum of 1', async () => {
    mockedGet.mockResolvedValueOnce({
      data: { data: [], meta: { total: 0 } },
    });

    render(
      <TestComponent
        filters={makeFilters({ per_page: 0 })}
        token="t"
        lang="fr"
      />
    );

    await waitFor(() => expect(mockedGet).toHaveBeenCalled());

    const calledParams = mockedGet.mock.calls[0][1].params;
    expect(calledParams.per_page).toBe(1);
  });

  it('handles 422 validation errors', async () => {
    const axiosErr = {
      isAxiosError: true,
      response: {
        status: 422,
        data: { errors: { foo: ['bad'] } },
      },
      code: 'E422',
    };
    mockedGet.mockRejectedValueOnce(axiosErr);

    render(
      <TestComponent
        filters={makeFilters()}
        token="tok"
        lang="en"
      />
    );

    await waitFor(() =>
      expect(screen.getByTestId('loading')).toHaveTextContent('false')
    );

    expect(screen.getByTestId('validation')).toHaveTextContent(
      JSON.stringify({ foo: ['bad'] })
    );
    expect(screen.getByTestId('error')).toHaveTextContent('');
    expect(screen.getByTestId('reports')).toHaveTextContent('');
    expect(screen.getByTestId('total')).toHaveTextContent('0');
  });

  it('handles 404 by resetting reports & total', async () => {
    const axiosErr = {
      isAxiosError: true,
      response: { status: 404, data: {} },
      code: 'E404',
    };
    mockedGet.mockRejectedValueOnce(axiosErr);

    render(
      <TestComponent
        filters={makeFilters({ per_page: 5, page: 7 })}
        token="token"
        lang="de"
      />
    );

    await waitFor(() =>
      expect(screen.getByTestId('loading')).toHaveTextContent('false')
    );

    expect(screen.getByTestId('reports')).toHaveTextContent('');
    expect(screen.getByTestId('total')).toHaveTextContent('0');
    expect(screen.getByTestId('error')).toHaveTextContent('');
    expect(screen.getByTestId('validation')).toHaveTextContent('');
  });

  it('handles axios errors other than 422/404 by setting error.code', async () => {
    const axiosErr = {
      isAxiosError: true,
      response: { status: 500, data: {} },
      code: 'E500',
    };
    mockedGet.mockRejectedValueOnce(axiosErr);

    render(
      <TestComponent
        filters={makeFilters()}
        token="tok"
        lang="es"
      />
    );

    await waitFor(() =>
      expect(screen.getByTestId('loading')).toHaveTextContent('false')
    );

    expect(screen.getByTestId('error')).toHaveTextContent('E500');
  });

  it('handles non-Axios errors by still setting error.code and covering the isAxiosError check', async () => {
    const customErr = { isAxiosError: false, code: 'NON_AXIOS' };
    mockedGet.mockRejectedValueOnce(customErr);

    render(
      <TestComponent
        filters={makeFilters()}
        token="tok"
        lang="pt"
      />
    );

    await waitFor(() =>
      expect(screen.getByTestId('loading')).toHaveTextContent('false')
    );

    // on est passé par `if (axios.isAxiosError(err))` qui a renvoyé false
    expect(screen.getByTestId('error')).toHaveTextContent('NON_AXIOS');
  });
});
