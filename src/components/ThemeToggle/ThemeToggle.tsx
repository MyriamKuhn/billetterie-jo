import IconButton from '@mui/material/IconButton';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon  from '@mui/icons-material/DarkMode';
import { useTranslation } from 'react-i18next';

interface ThemeToggleProps {
  mode: 'light' | 'dark';
  toggleMode: () => void;
}

function ThemeToggle({ mode, toggleMode }: ThemeToggleProps) {
  const { t } = useTranslation();
  return (
    <IconButton
      color="inherit"
      onClick={toggleMode}
      aria-label={mode === 'light' ? t('theme.dark') : t('theme.light')}
    >
      {mode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
    </IconButton>
  );
}

export default ThemeToggle;
