import IconButton from '@mui/material/IconButton';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon  from '@mui/icons-material/DarkMode';

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
      {mode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
    </IconButton>
  );
}

export default ThemeToggle;
