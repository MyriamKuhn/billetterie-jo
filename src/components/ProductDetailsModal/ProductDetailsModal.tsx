// src/components/ProductDetailsModal.tsx
import { useState, useEffect } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

import {
  CircularProgress
} from '@mui/material';
import axios from 'axios';
import type { Product } from '../../hooks/useProducts';

interface Props {
  open: boolean;
  productId: number | null;
  lang: string;
  onClose: () => void;
}

export function ProductDetailsModal({ open, productId, lang, onClose }: Props) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  useEffect(() => {
    if (!open || productId == null) return;
    setLoading(true);
    setError(null);
    setProduct(null);

    axios
      .get<{ data: Product }>(
        `https://api-jo2024.mkcodecreations.dev/api/products/${productId}`, 
        { headers: { 'Accept-Language': lang } }
      )
      .then(res => setProduct(res.data.data))
      .catch(err => {
        setError(
          axios.isAxiosError(err) && err.response?.data?.message
            ? err.response.data.message
            : err.message
        );
      })
      .finally(() => setLoading(false));
  }, [open, productId]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {loading ? 'Chargement…' : error ? 'Erreur' : product?.name}
      </DialogTitle>

      <DialogContent dividers>
        {loading && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Typography color="error" align="center">
            {error}
          </Typography>
        )}

        {product && (
          <Box component="div">
            <Box
              component="img"
              src={product.product_details.image}
              alt={product.name}
              sx={{ width: '100%', height: 200, objectFit: 'cover', mb: 2 }}
            />

            <Typography gutterBottom>
              <strong>Date / Heure : </strong>
              {product.product_details.date}{' '}
              {product.product_details.time}
            </Typography>

            <Typography gutterBottom>
              <strong>Lieu : </strong>
              {product.product_details.location}
            </Typography>

            <Typography gutterBottom>
              <strong>Catégorie : </strong>
              {product.product_details.category}
            </Typography>

            <Typography gutterBottom>
              <strong>Description : </strong>
              {typeof product.product_details.description === 'string'
                ? product.product_details.description
                : ('À personnaliser selon format API')}
            </Typography>

            <Typography gutterBottom>
              <strong>Places restantes : </strong>
              {product.product_details.places}
            </Typography>

            <Typography gutterBottom>
              <strong>Prix : </strong>
              {(product.sale > 0) ? (
                <>
                  <span style={{ textDecoration: 'line-through' }}>
                    {product.price.toLocaleString(undefined, { style:'currency', currency:'EUR' })}
                  </span>{' '}
                  <strong>
                    {(product.price * (1-product.sale)).toLocaleString(undefined,{style:'currency',currency:'EUR'})}
                  </strong>
                </>
              ) : (
                product.price.toLocaleString(undefined,{style:'currency',currency:'EUR'})
              )}
            </Typography>

            <Typography
              color={product.stock_quantity === 0 ? 'error' : undefined}
              gutterBottom
            >
              {product.stock_quantity === 0
                ? 'Épuisé'
                : `${product.stock_quantity} disponible(s)`}
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Fermer</Button>
        <Button
          variant="contained"
          disabled={product?.stock_quantity === 0 || loading || !!error}
          href={`/tickets/${productId}`}
        >
          {product?.stock_quantity === 0 ? 'Épuisé' : 'Acheter'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

