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
  disabled?: boolean;
}

/**
 * A debounced quantity input with "+" and "−" buttons, keeping a local text field in sync with cart item quantity
 * and clamping user input to valid bounds (0 to availableQuantity).
 * This component allows users to adjust the quantity of an item in a cart, with debouncing to prevent excessive updates. 
 */
export default function QuantityInput({
  item,
  adjustQty,
  debounceMs = 500, // Delay before firing text-input updates (defaults to 500ms)
  disabled = false,
}: QuantityInputProps) {
  // Local text value representing the quantity input field
  const [inputValue, setInputValue] = useState<string>(item.quantity.toString());

  // Ref to hold the debounce timer ID so we can clear it if needed
  const debounceRef = useRef<number | null>(null);

  // Keep local inputValue in sync when item.quantity changes externally
  useEffect(() => {
    setInputValue(item.quantity.toString());
  }, [item.quantity]);

  // If the input becomes disabled, immediately reset to the actual cart quantity
  useEffect(() => {
    if (disabled) {
      setInputValue(item.quantity.toString());
    }
  }, [disabled, item.quantity]);
  

  // Debounce effect: whenever inputValue changes, attempt to parse and update after delay
  useEffect(() => {
    if (disabled) {
      // Don't debounce when disabled
      return;
    }

    // Ignore empty string (user clearing field)
    if (inputValue === '') {
      return;
    }

    const rawVal = Number(inputValue);
    // Ignore non-numeric input
    if (isNaN(rawVal)) {
      return;
    }

    // No need to update if value equals current quantity
    if (rawVal === item.quantity) {
      return;
    }

    // Set up debounce timer
    debounceRef.current = window.setTimeout(() => {
      let newQty = rawVal;

      // Clamp negative values to zero
      if (newQty < 0) {
        newQty = 0;
      }

      // Clamp above available stock
      if (newQty > item.availableQuantity) {
        newQty = item.availableQuantity;
      }

      // Call the update callback
      adjustQty(item, newQty);

      // Reflect any clamping in the input field
      setInputValue(newQty.toString());

      debounceRef.current = null;
    }, debounceMs);

    // Cleanup: clear previous timer on unmount or before next effect run
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
    };
  }, [inputValue, item, adjustQty, debounceMs, disabled]);

  // Handle direct text input, only allowing digits or empty string
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) {
      // If disabled, immediately revert to actual quantity
      setInputValue(item.quantity.toString());
      return;
    }
    const raw = e.target.value;
    if (raw === '' || /^[0-9]+$/.test(raw)) {
      setInputValue(raw);
    }
  };

  // Immediate increment by 1 (up to availableQuantity)
  const increment = () => {
    adjustQty(item, Math.min(item.quantity + 1, item.availableQuantity));
  };
  // Immediate decrement by 1 (or to zero)
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
      {/* Decrement button */}
      <IconButton 
        size="small" 
        onClick={decrement} 
        disabled={disabled || item.quantity <= 0}
        aria-label="decrement quantity"
      >
        <RemoveIcon fontSize="small" />
      </IconButton>

      {/* Quantity text field */}
      <TextField
        type="text"
        size="small"
        value={inputValue}
        onChange={handleChange}
        onBlur={() => {
          // On blur, if the field is empty or disabled, reset to current quantity
          if (!disabled && inputValue === '') {
            setInputValue(item.quantity.toString());
          }
          if (disabled) {
            setInputValue(item.quantity.toString());
          }
        }}
        slotProps={{
          input: {
            inputProps: {
              inputMode: 'numeric',   // Mobile numeric keypad
              pattern: '[0-9]*',    
              style: { textAlign: 'center', width: 40 },
            },
          },
        }}
        disabled={disabled}
      />

      {/* Increment button */}
      <IconButton
        size="small"
        onClick={increment}
        aria-label="increment quantity"
        disabled={disabled || item.quantity >= item.availableQuantity}
      >
        <AddIcon fontSize="small" />
      </IconButton>
    </Box>
  );
}
