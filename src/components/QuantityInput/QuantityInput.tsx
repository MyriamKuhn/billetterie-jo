import { useState, useEffect, useRef } from 'react';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import RemoveIcon from '@mui/icons-material/Remove';
import AddIcon from '@mui/icons-material/Add';
import type { CartItem } from '../../stores/useCartStore';

interface QuantityInputProps {
  item: CartItem;
  adjustQty: (item: CartItem, newQty: number) => void;
  debounceMs?: number;
}

export default function QuantityInput({
  item,
  adjustQty,
  debounceMs = 500, // Délai par défaut (ms) avant d'envoyer la mise à jour
}: QuantityInputProps) {
  // Valeur locale du champ, sous forme de chaîne
  const [inputValue, setInputValue] = useState<string>(item.quantity.toString());

  // Référence pour stocker l'ID du timer de debounce
  const debounceRef = useRef<number | null>(null);

  // Si item.quantity change (suite à un clic sur +/– par exemple), on synchronise inputValue
  useEffect(() => {
    setInputValue(item.quantity.toString());
  }, [item.quantity]);

  // Effet : à chaque modification de inputValue, on démarre (ou on reset) le debounce
  useEffect(() => {
    // Si l'utilisateur a complètement vidé le champ, on ne déclenche rien
    if (inputValue === '') {
      return;
    }

    // Convertir en nombre
    const rawVal = Number(inputValue);

    // Si ce n'est pas un nombre valide, on ne déclenche pas non plus
    if (isNaN(rawVal)) {
      return;
    }

    // Si la valeur (rawVal) est identique à item.quantity, on n'a pas besoin d'actualiser
    if (rawVal === item.quantity) {
      return;
    }

    // On démarre un nouveau timer
    debounceRef.current = window.setTimeout(() => {
      let newQty = rawVal;

      // Clamp : si la valeur est négative, on met 0
      if (newQty < 0) {
        newQty = 0;
      }

      // Clap : si la valeur dépasse le stock, on met availableQuantity
      if (newQty > item.availableQuantity) {
        newQty = item.availableQuantity;
      }

      // On applique la mise à jour
      adjustQty(item, newQty);

      // On met à jour inputValue pour refléter le clamp
      setInputValue(newQty.toString());

      debounceRef.current = null;
    }, debounceMs);

    // Cleanup à chaque nouvelle exécution ou démontage
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
    };
  }, [inputValue, item, adjustQty, debounceMs]);

  // Gère la saisie utilisateur (on accepte uniquement chiffres ou chaîne vide)
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw === '' || /^[0-9]+$/.test(raw)) {
      setInputValue(raw);
    }
  };

  // Les boutons +/- qui appellent adjustQty immédiatement
  const increment = () => {
    adjustQty(item, Math.min(item.quantity + 1, item.availableQuantity));
  };
  const decrement = () => {
    adjustQty(item, Math.max(item.quantity - 1, 0));
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 1,
      }}
    >
      <IconButton size="small" onClick={decrement} disabled={item.quantity <= 0}>
        <RemoveIcon fontSize="small" />
      </IconButton>

      <TextField
        type="text"
        size="small"
        value={inputValue}
        onChange={handleChange}
        slotProps={{
          input: {
            inputProps: {
              inputMode: 'numeric', 
              pattern: '[0-9]*',    
              style: { textAlign: 'center', width: 40 },
            },
          },
        }}
      />

      <IconButton
        size="small"
        onClick={increment}
        disabled={item.quantity >= item.availableQuantity}
      >
        <AddIcon fontSize="small" />
      </IconButton>
    </Box>
  );
}
