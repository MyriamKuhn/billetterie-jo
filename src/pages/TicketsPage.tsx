import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import OlympicLoader from '../components/OlympicLoader';
import Seo from '../components/Seo';
import Pagination from '@mui/material/Pagination';
import Typography from '@mui/material/Typography';
import { ProductsFilters } from '../components/ProductsFilters';
import { ProductGrid } from '../components/ProductGrid';
import { useLanguageStore } from '../stores/useLanguageStore';
import type { Filters } from '../hooks/useProducts';
import { useProducts } from '../hooks/useProducts';
import { PageWrapper } from '../components/PageWrapper';
import { ProductDetailsModal } from '../components/ProductDetailsModal';
import { useTranslation } from 'react-i18next';
import { ErrorDisplay } from '../components/ErrorDisplay';

export default function ProductsPage() {
  const { t } = useTranslation('ticket');
  const lang = useLanguageStore(s => s.lang);

  // --- États ---
  const [filters, setFilters] = useState<Filters>({
    name:'', category:'', location:'', date:'', places:0,
    sortBy:'name', order:'asc', perPage:15, page:1,
  });

  const { products, total, loading, error, validationErrors } = useProducts(filters, lang);

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

  // --- Helpers de format ---
  const fmtCur = (v: number) =>
    new Intl.NumberFormat(lang, { style: 'currency', currency: 'EUR' }).format(v);

  const fmtDate = (iso?: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    return new Intl.DateTimeFormat(lang, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(d);
  };

  if (error) {
    return (
      <ErrorDisplay
        title={t('errors.title')}
        message={t('errors.unexpected')}
        retryButtonText={t('errors.retry')}
        onRetry={() => setFilters(f => ({ ...f }))}
        showHome
        homeButtonText={t('errors.home')}
      />
  );
}
  
  // --- Rendu normal loader / grille / pagination ---
  return (
    <>
      <Seo title={t('tickets.seo_title')} description={t('tickets.seo_description')} />
      <PageWrapper disableCard>
        <Typography variant="h4" sx={{ px:2 }}>
          {t('tickets.title')}
        </Typography>
        <Box sx={{ display:'flex', flexDirection:{ xs:'column', md:'row' }, gap:2, p:2 }}>
          {/* Sidebar filtres */}
          <ProductsFilters filters={filters} onChange={upd=>setFilters(f=>({...f,...upd}))}/>

          {/* Contenu principal */}
          <Box component="main" flex={1}>
            {loading
              ? <Box textAlign="center" py={8}><OlympicLoader/></Box>
              : <ProductGrid products={products} fmtCur={fmtCur} fmtDate={fmtDate} onViewDetails={setDetailsId} />}
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