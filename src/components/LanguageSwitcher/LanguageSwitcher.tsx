import { Select, MenuItem, type SelectChangeEvent } from '@mui/material';
import Flag from 'react-world-flags';
import { useLanguageStore } from '../../stores/useLanguageStore';
import { useTranslation } from 'react-i18next';

const languages = [
  { lang: 'fr', country: 'FR', label: 'Français' },
  { lang: 'en', country: 'US', label: 'English' },
  { lang: 'de', country: 'DE', label: 'Deutsch' },
];

export function LanguageSwitcher() {
  const { t } = useTranslation();
  const lang = useLanguageStore(state => state.lang);
  const setLang = useLanguageStore(state => state.setLang);

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
        const cfg = languages.find(l => l.lang === value);
        return cfg ? <Flag code={cfg.country} style={{ width: 24, height: 16 }} /> : null;
      }}
      sx={{ minWidth: 60 }}
    >
      {languages.map(({ lang, country, label }) => (
        <MenuItem key={lang} value={lang}>
          <Flag code={country} style={{ width: 24, height: 16, marginRight: 8 }} />
          {label}
        </MenuItem>
      ))}
    </Select>
  );
}
