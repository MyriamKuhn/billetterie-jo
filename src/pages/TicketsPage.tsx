import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import OlympicLoader from '../components/OlympicLoader';
import Seo from '../components/Seo';
import axios from 'axios';
import Pagination from '@mui/material/Pagination';
import Card from '@mui/material/Card';
import CardMedia from '@mui/material/CardMedia';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import { ProductsFilters } from '../components/ProductsFilters';
import { useLanguageStore } from '../stores/useLanguageStore';

interface ProductDetails {
  places: number;
  description: string;
  image: string;
  date: string;
  time: string;
  location: string;
  category: string;
}

interface Product {
  id: number;
  name: string;
  price: number;
  sale: number;
  stock_quantity: number;
  product_details: ProductDetails;
}

export default function ProductsPage() {
  const lang = useLanguageStore(s => s.lang);

  // --- États (toujours en haut) ---
  const [filters, setFilters] = useState({
    name: '',
    category: '',
    location: '',
    date: '',
    places: 0,
    sortBy: 'name' as 'name' | 'price' | 'date',
    order: 'asc' as 'asc' | 'desc',
    perPage: 15,
    page: 1,
  });
  const [products, setProducts]     = useState<Product[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState<string|null>(null);

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

  // --- Effet de chargement + filtre + tri API ---
  useEffect(() => {
    setLoading(true);
    setError(null);

    // Mapping sort_by côté API
    const sortByMap: Record<'name'|'price'|'date', string> = {
      name:  'name',
      price: 'price',
      date:  'product_details->date',
    };
    const apiSort = sortByMap[filters.sortBy];

    // Si mapping invalide, on remet à l’état par défaut et on arrête
    if (!apiSort) {
      setFilters(f => ({ ...f, sortBy: 'name', order: 'asc' }));
      setLoading(false);
      return;
    }

    // Toujours assurer perPage ≥ 1
    const perPage = Math.max(1, filters.perPage);

    // Construction des params
    const params: Record<string, any> = {
      per_page: perPage,
      page:     filters.page,
      sort_by:  apiSort,
      order:    filters.order,
      // on peut ajouter ici d’autres filtres server-side si désiré :
      ...(filters.date     && { date:     filters.date     }),
      ...(filters.name     && { name:     filters.name     }),
      ...(filters.category && { category: filters.category }),
      ...(filters.location && { location: filters.location }),
      ...(filters.places > 0 && { places: filters.places }),
    };

    axios
      .get('https://api-jo2024.mkcodecreations.dev/api/products', {
        params,
        headers: { 'Accept-Language': lang },
      })
      .then(res => {
        // 200 OK
        setProducts(res.data.data);
        setTotalItems(res.data.pagination.total);
      })
      .catch(err => {
        if (axios.isAxiosError(err)) {
          const status = err.response?.status;

          // 422 → filtre refusé par l’API (e.g. sort_by ou date invalide)
          if (status === 422) {
            const errs = err.response!.data.errors as Record<string,string[]>;
            const cleanup: Partial<typeof filters> = {};
            if (errs.sort_by)   { cleanup.sortBy = 'name'; cleanup.order = 'asc'; }
            if (errs.date)      { cleanup.date   = ''; }
            setFilters(f => ({ ...f, ...cleanup }));
            return; 
          }

          // 404 → ressource non trouvée → on affiche « aucun billet »
          if (status === 404) {
            setProducts([]);
            setTotalItems(0);
            return;
          }
        }

        // autre erreur → bloquante
        const msg = axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : err.message;
        setError(msg);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [filters, lang]);

  // --- UI de fallback en cas d’erreur bloquante ---
  if (error) {
    return (
      <Box sx={{ p:4, textAlign:'center' }}>
        <Typography variant="h5" gutterBottom>
          Oups… une erreur est survenue
        </Typography>
        <Typography variant="body1" sx={{ mb:2 }}>
          {error}
        </Typography>
        <Button onClick={() => setFilters(f => ({ ...f }))}>
          Réessayer
        </Button>
      </Box>
    );
  }

  // --- Rendu normal loader / grille / pagination ---
  return (
    <>
      <Seo title='Billets disponibles en vente - Billetterie JO Paris 2024' description='Petite description SEO' />
      <Typography variant="h4" sx={{ mt: 4, px:2 }}>
        Billets disponibles en vente
      </Typography>
      <Box sx={{
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        gap: 2,
        px: 2,
        py: 4,
      }}>
        {/* Sidebar filtres */}
        <ProductsFilters
          filters={filters}
          onChange={upd => setFilters(f => ({ ...f, ...upd }))}
        />

        {/* Contenu principal */}
        <Box component="main" sx={{ flexGrow:1 }}>
          {loading ? (
            <Box sx={{ textAlign:'center', py:8 }}>
              <OlympicLoader />
            </Box>
          ) : (
            <>
              <Box
                sx={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 4,
                  justifyContent: products.length ? 'flex-start' : 'center',
                }}
              >
                {products.map(p => {
                  const soldOut    = p.stock_quantity === 0;
                  const finalPrice = p.price * (1 - p.sale);
                  // extrait short description
                  let sd = p.product_details.description;
                  if (Array.isArray(sd)) {
                    sd = Array.isArray(sd[0]) ? sd[0][0] : sd[0] as string;
                  }

                  return (
                    <Box
                      key={p.id}
                      sx={{
                        flex: '1 1 calc(33.333% - 32px)',
                        minWidth: 280,
                        maxWidth: 320,
                        display: 'flex',
                        flexDirection: 'column',
                      }}
                    >
                      <Card sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                        <CardMedia
                          component="img"
                          height="180"
                          image={p.product_details.image}
                          alt={p.name}
                        />
                        <CardContent sx={{ flexGrow: 1 }}>
                          <Typography variant="h6" gutterBottom>
                            {p.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" gutterBottom>
                            Catégorie : {p.product_details.category}
                          </Typography>
                          <Typography variant="body2" gutterBottom>
                            {fmtDate(p.product_details.date)}
                            {p.product_details.time && ` – ${p.product_details.time}`}
                          </Typography>
                          {p.product_details.location && (
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              Lieu : {p.product_details.location}
                            </Typography>
                          )}
                          {sd && (
                            <Typography variant="body2" paragraph>
                              {sd}
                            </Typography>
                          )}
                          <Typography variant="body2" color="text.secondary">
                            {p.product_details.places} place(s)
                          </Typography>
                          <Box sx={{ display:'flex', alignItems:'baseline', gap:1, mt:1 }}>
                            {p.sale > 0 && (
                              <Typography variant="body2" sx={{ textDecoration:'line-through' }}>
                                {fmtCur(p.price)}
                              </Typography>
                            )}
                            <Typography variant="subtitle1" sx={{ fontWeight:'bold' }}>
                              {fmtCur(finalPrice)}
                            </Typography>
                            {p.sale > 0 && (
                              <Chip label={`–${Math.round(p.sale * 100)}%`} size="small" />
                            )}
                          </Box>
                          <Typography
                            variant="body2"
                            color={soldOut ? 'error.main' : 'text.secondary'}
                            sx={{ mt:1 }}
                          >
                            {soldOut ? 'Épuisé' : `${p.stock_quantity} disponible(s)`}
                          </Typography>
                        </CardContent>
                        <CardActions>
                          <Button
                            size="small"
                            variant="contained"
                            disabled={soldOut}
                            href={`/tickets/${p.id}`}
                          >
                            {soldOut ? 'Épuisé' : 'Acheter'}
                          </Button>
                        </CardActions>
                      </Card>
                    </Box>
                  );
                })}
              </Box>

              {products.length === 0 ? (
                <Box sx={{ p: 4, textAlign: 'center', width: '100%' }}>
                  <Typography variant="h6">Aucun billet trouvé</Typography>
                </Box>
              ) : (
                <Box textAlign="center" mt={4}>
                  <Pagination
                    count={Math.max(1, Math.ceil(totalItems / filters.perPage))}
                    page={filters.page}
                    onChange={(_, p) => setFilters(f => ({ ...f, page: p }))}
                    color="primary"
                  />
                </Box>
              )}
            </>
          )}
        </Box>
      </Box>
    </>
  );
}
