import { Button } from '@mui/material';
import { useCartStore } from '../../stores/cartStore';

export function DevAddTestItem() {
  const addTest = () => {
    useCartStore.setState({
      items: [
        { id: 'dev-1', name: 'Ticket d’essai', price: 12.5, quantity: 1 },
      ]
    });
  };

  return (
    <Button 
      size="small" 
      variant="contained" 
      color="secondary" 
      onClick={addTest}
      sx={{ position: 'fixed', bottom: 16, right: 16, zIndex: 1300 }}
    >
      Dev: remplir panier
    </Button>
  );
}
