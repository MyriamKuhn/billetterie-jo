import React from 'react';
import { useReloadCart } from '../hooks/useReloadCart';
import { useStockChangeNotifier } from '../hooks/useStockChangeNotifier';
import { useCartStore } from '../stores/cartStore';

export function CartPage() {
  const { loading, hasError, reload } = useReloadCart();
  const items = useCartStore(s => s.items);
  const clearCart = useCartStore(s => s.clearCart);

  useStockChangeNotifier(items);

  React.useEffect(() => {
    reload();
  }, [reload]);

  //if (loading) return <LoadingSpinner />;
  //if (hasError) return <ErrorDisplay message="Impossible de charger le panier" />;

  return (
    //<CartTable items={items} onClear={clearCart} />
  );
}
