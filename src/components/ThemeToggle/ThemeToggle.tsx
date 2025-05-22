import { IconButton } from '@mui/material';
import { LightMode, DarkMode } from '@mui/icons-material';

interface ThemeToggleProps {
  mode: 'light' | 'dark';
  toggleMode: () => void;
}

function ThemeToggle({ mode, toggleMode }: ThemeToggleProps) {
  return (
    <IconButton
      color="inherit"
      onClick={toggleMode}
      aria-label={mode === 'light' ? 'Activer le mode sombre' : 'Activer le mode clair'}
    >
      {mode === 'light' ? <DarkMode /> : <LightMode />}
    </IconButton>
  );
}

export default ThemeToggle;
