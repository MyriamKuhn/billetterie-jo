import Select, { type SelectChangeEvent } from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';

import { useLanguageStore } from '../../stores/useLanguageStore';
import { useTranslation } from 'react-i18next';

import FlagIcon, { type CountryCode } from '../FlagIcon';

// Supported languages with their locale code, country flag code, and label
const languages: Array<{
  lang: string;
  country: CountryCode;
  label: string;
}> = [
  { lang: "fr", country: "FR", label: "Français" },
  { lang: "en", country: "US", label: "English" },
  { lang: "de", country: "DE", label: "Deutsch" },
];

/**
 * A dropdown to switch the app’s language, displaying country flags and language labels.
 * This component uses the `useLanguageStore` to manage the current language state.
 * It renders a select input with options for each language, showing the corresponding flag icon.
 */
function LanguageSwitcher() {
  const { t } = useTranslation();
  const lang = useLanguageStore(state => state.lang);
  const setLang = useLanguageStore(state => state.setLang);

  // Handler for Select change events
  const handleChange = (e: SelectChangeEvent<string>) => {
    setLang(e.target.value as typeof lang);
  };

  return (
    <Select
      value={lang}
      onChange={handleChange}
      size="small"
      aria-label={t('navbar.language')}
      renderValue={value => {
        // Render the flag of the selected language in the closed state
        const cfg = languages.find(l => l.lang === value);
        return cfg ? <FlagIcon code={cfg.country} /> : null;
      }}
      sx={{ minWidth: 60 }}
    >
      {languages.map(({ lang, country, label }) => (
        <MenuItem key={lang} value={lang}>
          {/* Flag icon with spacing */}
          <FlagIcon code={country} style={{ marginRight: 8 }} />
          {/* Language label */}
          {label}
        </MenuItem>
      ))}
    </Select>
  );
}

export default LanguageSwitcher;
