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
import { formatCurrency, formatDate } from '../utils/format';
import { useAddToCart } from '../hooks/useAddToCart';
import { useCartStore } from '../stores/useCartStore';

/**
 * ProductsPage
 * Shows a list of products with filters, pagination, and details modal.
 * It integrates with the cart system to allow adding products.
 */
export default function ProductsPage() {
  const { t } = useTranslation('ticket');
  const lang = useLanguageStore(s => s.lang);
  const cartItems = useCartStore(s => s.items);
  const addToCart = useAddToCart();

  // Filter state
  const [filters, setFilters] = useState<Filters>({
    name:'', category:'', location:'', date:'', places:0,
    sortBy:'name', order:'asc', perPage:15, page:1,
  });

  // Fetch products based on filters
  const { products, total, loading, error, validationErrors } = useProducts(filters, lang);

  // Selected product for details modal
  const [detailsId, setDetailsId] = useState<number | null>(null);

  // Reset invalid filters on validation errors
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

  // Format helpers
  const fmtCur = (v: number)   => formatCurrency(v, lang, 'EUR');
  const fmtDate = (iso?: string) => formatDate(iso, lang);

  // Error state
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
  
  // Render the products page
  return (
    <>
      {/* SEO meta tags */}
      <Seo title={t('tickets.seo_title')} description={t('tickets.seo_description')} />
      <PageWrapper disableCard>
        <Typography variant="h4" sx={{ px:2 }}>
          {t('tickets.title')}
        </Typography>
        <Box sx={{ display:'flex', flexDirection:{ xs:'column', md:'row' }, gap:2, p:2 }}>
          {/* Filters sidebar */}
          <ProductsFilters filters={filters} onChange={upd=>setFilters(f=>({...f,...upd}))}/>

          {/* Main content area */}
          <Box component="main" flex={1}>
            {loading
              ? <Box textAlign="center" py={8}><OlympicLoader/></Box>
              : <ProductGrid
                  products={products}
                  fmtCur={fmtCur}
                  fmtDate={fmtDate}
                  onViewDetails={setDetailsId}
                  onBuy={async (prod) => {
                    const existing = cartItems.find(i => i.id === prod.id.toString());
                    const currentQty = existing?.quantity ?? 0;
                    const newQty = currentQty + 1;
                    const ok = await addToCart(
                      prod.id.toString(),
                      newQty,
                      prod.stock_quantity
                    );
                    if (ok) setDetailsId(null);}}
                />
              }

            {/* Pagination */} 
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

      {/* Product details modal */}
      <ProductDetailsModal
        open={detailsId !== null}
        productId={detailsId}
        lang={lang}
        onClose={() => setDetailsId(null)}
      />
    </>
  );
}