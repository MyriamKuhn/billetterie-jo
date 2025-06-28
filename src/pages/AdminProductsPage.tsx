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
import { ProductDetailsModal } from '../components/ProductDetailsModal';
import { useTranslation } from 'react-i18next';
import { ErrorDisplay } from '../components/ErrorDisplay';
import { useAuthStore } from '../stores/useAuthStore';
import { useUpdateProductPricing } from '../hooks/useUpdateProductPricing';

export default function AdminProductsPage() {
  const { t } = useTranslation('adminProducts');
  const lang = useLanguageStore(s => s.lang);
  const token = useAuthStore((state) => state.authToken);
  const updatePricing = useUpdateProductPricing();

  // --- États ---
  const [filters, setFilters] = useState<Filters>({
    name:'', category:'', location:'', date:'', places:0,
    sortBy:'name', order:'asc', perPage:15, page:1,
  });

  const { products, total, loading, error, validationErrors } = useAdminProducts(filters, lang, token!);

  const [detailsId, setDetailsId] = useState<number | null>(null);

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
  
  // --- Rendu normal loader / grille / pagination ---
  return (
    <>
      <Seo title={t('seo.title')} description={t('seo.description')} />
      <PageWrapper disableCard>
        <Typography variant="h4" sx={{ px:2 }}>
          {t('products.title')}
        </Typography>
        <Box sx={{ display:'flex', flexDirection:{ xs:'column', md:'row' }, gap:2, p:2 }}>
          {/* Sidebar filtres */}
          <ProductsFilters filters={filters} onChange={upd=>setFilters(f=>({...f,...upd}))}/>

          {/* Contenu principal */}
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
                />
              }
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

      <ProductDetailsModal
        open={detailsId !== null}
        productId={detailsId}
        lang={lang}
        onClose={() => setDetailsId(null)}
      />
    </>
  );
}