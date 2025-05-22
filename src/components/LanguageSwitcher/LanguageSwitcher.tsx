import Select, { type SelectChangeEvent } from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';

import { useLanguageStore } from '../../stores/useLanguageStore';
import { useTranslation } from 'react-i18next';

import FlagIcon, { type CountryCode } from '../FlagIcon';

const languages: Array<{
  lang: string;
  country: CountryCode;
  label: string;
}> = [
  { lang: "fr", country: "FR", label: "Français" },
  { lang: "en", country: "US", label: "English" },
  { lang: "de", country: "DE", label: "Deutsch" },
];

function LanguageSwitcher() {
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
        return cfg ? <FlagIcon code={cfg.country} /> : null;
      }}
      sx={{ minWidth: 60 }}
    >
      {languages.map(({ lang, country, label }) => (
        <MenuItem key={lang} value={lang}>
          <FlagIcon code={country} style={{ marginRight: 8 }} />
          {label}
        </MenuItem>
      ))}
    </Select>
  );
}

export default LanguageSwitcher;
