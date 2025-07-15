import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import OlympicLoader from '../components/OlympicLoader';
import Seo from '../components/Seo';
import Pagination from '@mui/material/Pagination';
import Typography from '@mui/material/Typography';
import { ProductsFilters } from '../components/ProductsFilters';
import { AdminProductGrid } from '../components/AdminProductGrid';
import { useLanguageStore } from '../stores/useLanguageStore';
import type { Filters } from '../hooks/useProducts';
import { useAdminProducts } from '../hooks/useAdminProducts';
import { PageWrapper } from '../components/PageWrapper';
import { AdminProductDetailsModal } from '../components/AdminProductDetailsModal';
import { useTranslation } from 'react-i18next';
import { ErrorDisplay } from '../components/ErrorDisplay';
import { useAuthStore } from '../stores/useAuthStore';
import { useUpdateProductPricing } from '../hooks/useUpdateProductPricing';
import { AdminProductDuplicationModal } from '../components/AdminProductDuplicationModal';
import { AdminProductCreateModal } from '../components/AdminProductCreateModal';

/**
 * AdminProductsPage - Page for managing products in the admin panel.
 * It allows filtering, viewing details, duplicating, creating, and updating product pricing.
 * This page is designed for administrators to manage products effectively.
 * It includes features such as:
 * - Filtering products by various criteria (name, category, location, date, places).
 * - Sorting products by name or date.
 * - Viewing product details in a modal.
 * - Duplicating existing products.
 * - Creating new products through a modal.
 */
export default function AdminProductsPage() {
  const { t } = useTranslation('adminProducts');
  const lang = useLanguageStore(s => s.lang);
  const token = useAuthStore((state) => state.authToken);
  const updatePricing = useUpdateProductPricing();

  // --- Local state for filters ---
  const [filters, setFilters] = useState<Filters>({
    name:'', category:'', location:'', date:'', places:0,
    sortBy:'name', order:'asc', perPage:15, page:1,
  });

  // Fetch products based on filters, language, and token
  const { products, total, loading, error, validationErrors } = useAdminProducts(filters, lang, token!);

  // ID of the product to show details or duplicate
  const [detailsId, setDetailsId] = useState<number | null>(null);
  const [duplicateId, setDuplicateId] = useState<number | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  // Clear invalid filter fields returned by server-side validation
  useEffect(() => {
    if (validationErrors) {
      const cleanup: Partial<Filters> = {};

      if (validationErrors.sort_by)   { cleanup.sortBy = 'name'; cleanup.order = 'asc'; }
      if (validationErrors.date)      { cleanup.date   = ''; }
      if (validationErrors.name)      { cleanup.name   = ''; }
      if (validationErrors.category)  { cleanup.category = ''; }
      if (validationErrors.location)  { cleanup.location = ''; }
      if (validationErrors.places)    { cleanup.places = 0; }

      setFilters(f => ({ ...f, ...cleanup }));
    }
  }, [validationErrors]);

  // Show error page if fetch fails
  if (error) {
    return (
      <PageWrapper>
        <ErrorDisplay
          title={t('errors.title')}
          message={t('errors.unexpected')}
          showRetry
          retryButtonText={t('errors.retry')}
          onRetry={() => setFilters(f => ({ ...f }))}
          showHome
          homeButtonText={t('errors.home')}
        />
      </PageWrapper>
    );
  }
  
  // Render the admin products page with filters, product grid, and modals
  return (
    <>
      <Seo title={t('seo.title')} description={t('seo.description')} />
      {/* Main layout without card wrapper */}
      <PageWrapper disableCard>
        <Typography variant="h4" sx={{ px:2 }}>
          {t('products.title')}
        </Typography>
        <Box sx={{ display:'flex', flexDirection:{ xs:'column', md:'row' }, gap:2, p:2 }}>
          {/* Sidebar for filters */}
          <ProductsFilters filters={filters} onChange={upd=>setFilters(f=>({...f,...upd}))}/>

          {/* Main content area */}
          <Box component="main" flex={1}>
            {loading
              ? <Box textAlign="center" py={8}><OlympicLoader/></Box>
              : <AdminProductGrid
                  products={products}
                  lang={lang}
                  onViewDetails={setDetailsId}
                  onSave={async (id, updates) => {
                    const ok = await updatePricing(id, {
                      price: updates.price,
                      sale: updates.sale,
                      stock_quantity: updates.stock_quantity,
                    });
                    return ok;
                  }}
                  onRefresh={() => setFilters(f => ({ ...f }))}
                  onDuplicate={setDuplicateId}
                  onCreate={() => setCreateOpen(true)}
                />
              }

            {/* Pagination controls */}  
            {!loading && products.length>0 && (
              <Box textAlign="center" mt={4}>
                <Pagination
                  count={Math.ceil(total/filters.perPage)||1}
                  page={filters.page}
                  onChange={(_,p)=>setFilters(f=>({...f,page:p}))}
                />
              </Box>
            )}
          </Box>
        </Box>
      </PageWrapper>

      {/* Modals for details, duplication, and creation */}
      <AdminProductDetailsModal
        open={detailsId !== null}
        productId={detailsId}
        lang={lang}
        onClose={() => setDetailsId(null)}
        onRefresh={() => setFilters(f=>({...f}))}
      />
      <AdminProductDuplicationModal
        open={duplicateId !== null}
        productId={duplicateId}
        lang={lang}
        onClose={() => setDuplicateId(null)}
        onRefresh={() => setFilters(f=>({...f}))}
      />
      <AdminProductCreateModal
        open={createOpen}
        lang={lang}
        onClose={() => setCreateOpen(false)}
        onRefresh={() => setFilters(f=>({...f}))}
      />
    </>
  );
}