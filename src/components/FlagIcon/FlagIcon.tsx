import { type CSSProperties } from 'react';
import fr from "../../assets/flags/FR.svg";
import us from "../../assets/flags/US.svg";
import de from "../../assets/flags/DE.svg";

// Restrict the country codes to the keys we have assets for
export type CountryCode = 'FR' | 'US' | 'DE';

// Map each country code to its corresponding SVG import
const FLAG_MAP: Record<CountryCode, string> = {
  FR: fr,
  US: us,
  DE: de,
};

interface FlagIconProps {
  code: CountryCode;
  width?: number;
  height?: number;
  className?: string;
  style?: CSSProperties;
}

/**
 * FlagIcon:
 * Renders an <img> using the SVG corresponding to `code`.
 * Allows customizing size, CSS class, and inline styles.
 */
function FlagIcon({ code, width = 24, height = 16, className, style }: FlagIconProps) {
  return (
    <img
      src={FLAG_MAP[code]}
      width={width}
      height={height}
      alt={`Flag ${code}`}
      className={className}
      style={style}
    />
  );
}

export default FlagIcon;