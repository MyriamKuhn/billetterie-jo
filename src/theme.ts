import { createTheme, type Theme, type PaletteMode, type Shadows } from '@mui/material/styles';

const brandColors = {
  primary:   '#68B9B5',  
  secondary: '#0B1B2B',  
  accent:    '#F8E1B0',  
  info:      '#0085C7',  
  warning:   '#FFCD00',  
  error:     '#E31937',  
  success:   '#009739',  
};

const backgroundDefaults = {
  light: { default: '#F4F4F4', paper: '#FFFFFF' },
  dark:  { default: '#121212', paper: '#0C1F2B' },
};

const textDefaults = {
  light:   { primary: '#0C1B2B', secondary: '#576271' },
  dark:    { primary: '#F9E8C4', secondary: '#C0C0C0' },
};

const customShadows: Partial<Record<number, string>> = {
  1: '0px 1px 3px rgba(0,0,0,0.2)',
  2: '0px 1px 5px rgba(0,0,0,0.14)',
  3: '0px 1px 8px rgba(0,0,0,0.12)',
  4: '0px 2px 4px rgba(0,0,0,0.12)',
};

/**
 * getAppTheme
 * Generates a Material-UI theme based on the provided mode.
 * This theme includes custom colors, typography, and component styles.
 */
export const getAppTheme = (mode: PaletteMode): Theme => {
  const isLight = mode === 'light';

  // Create a default theme to extract its shadows array
  const defaultTheme = createTheme();
  const defaultShadows: Shadows = defaultTheme.shadows;

  // Override the first few shadow levels, leave the rest as default
  const shadows: Shadows = defaultShadows.map((sh, idx) =>
    customShadows[idx] ?? sh
  ) as Shadows;

  return createTheme({
    palette: {
      mode,
      primary: { main: brandColors.primary },
      secondary: { main: brandColors.secondary },
      error: { main: brandColors.error },
      warning: { main: brandColors.warning },
      info: { main: brandColors.info },
      success: { main: brandColors.success },
      background: backgroundDefaults[mode],
      text:       textDefaults[mode],
      divider: isLight ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.12)',
    },
    shape: { borderRadius: 10 },   
    shadows,    
    typography: {
      fontFamily: 'Poppins, Arial, sans-serif',
      h1: { fontSize: '2.5rem', fontWeight: 700 },
      h2: { fontSize: '2rem', fontWeight: 700 },
      h3: { fontSize: '1.75rem', fontWeight: 700 },
      h4: { fontSize: '1.5rem', fontWeight: 400, textTransform: 'uppercase' },
      h5: { fontSize: '1.25rem', fontWeight: 400 },
      h6: { fontSize: '1.125rem', fontWeight: 500, textTransform: 'uppercase' },
      body1: { fontSize: '1rem', fontWeight: 400 },
      body2: { fontSize: '0.875rem', fontWeight: 400 },
      subtitle1: { fontSize: '1rem', fontWeight: 400 },
      subtitle2: { fontSize: '0.875rem', fontWeight: 500 },
    },
    components: {
      MuiCard: {
        styleOverrides: {
          root: ({ theme }) => ({
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 10,
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            padding: '40px 20px',
          }),
        },
      },
      MuiButton: {
        styleOverrides: {
          text: ({ theme, ownerState }) => {
            // If in light mode and not an inheritance color, use info color for text buttons
            if (
              theme.palette.mode === 'light' &&
              ownerState.color !== 'inherit'
            ) {
              return {
                color: theme.palette.info.main,
                '&:hover': {
                  backgroundColor: `${theme.palette.info.main}10`,
                },
              };
            }
            return {}; // sinon, pas de changement
          },
          containedPrimary: ({ theme }) => ({
            // Primary contained buttons use info palette
            backgroundColor:
              theme.palette.mode === 'dark'
                ? theme.palette.primary.dark
                : theme.palette.info.main,
            color:
              theme.palette.mode === 'dark'
                ? theme.palette.primary.contrastText
                : theme.palette.info.contrastText,
            '&:hover': {
              backgroundColor:
                theme.palette.mode === 'dark'
                  ? theme.palette.primary.main
                  : theme.palette.info.light,
            },
          }),
          ...(isLight && {
            outlinedPrimary: {
              // In light mode, primary outlined buttons use secondary color
              borderColor:     brandColors.secondary,
              color:           brandColors.secondary,
              '&:hover': {
                borderColor:     brandColors.secondary,
                backgroundColor: `${brandColors.secondary}10`,
              },
            },
          }),
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: ({ theme }) => ({
            // Icon buttons match info/main in light, or text primary in dark
            color: isLight ? theme.palette.info.main : theme.palette.text.primary,
          }),
        },
      },
      MuiListItemIcon: {
        styleOverrides: {
          root: ({ theme }) => ({
            // List item icons follow same coloring as icon buttons
            color: isLight ? theme.palette.info.main : theme.palette.text.primary,
          }),
        },
      },
      MuiBadge: {
        styleOverrides: {
          badge: ({ theme }) => ({
            // Custom badge style
            backgroundColor: isLight ? theme.palette.text.primary : theme.palette.info.main,
            color:           '#fff',
            minWidth:        16,
            height:          16,
            fontSize:        '0.625rem',
            borderRadius:    '50%',
            transform:       'translate(35%, 35%)',
          }),
        },
      },
      MuiLink: {
        styleOverrides: {
          root: ({ theme }) => ({
            // Underlined links with hover color change
            color: theme.palette.mode === 'light'
              ? theme.palette.primary.dark
              : theme.palette.primary.light,
            textDecoration: 'underline',
            '&:hover': {
              color: theme.palette.primary.main,
            },
          }),
        },
      },
      MuiRadio: {
        styleOverrides: {
          root: ({ theme }) => ({
            // Radio buttons coloring
            color: theme.palette.text.secondary,
            '&.Mui-checked': {
              color: theme.palette.mode === 'dark'
                  ? theme.palette.primary.dark
                  : theme.palette.info.main,
            },
          }),
        },
      }, 
      MuiPagination: {
        styleOverrides: {
          root: {
            // Center and add vertical spacing
            display: 'flex',
            justifyContent: 'center',
            padding: '1rem 0',
          },
        },
      },    
      MuiPaginationItem: {
        styleOverrides: {
          root: ({ theme }) => ({
            // Page item sizing and selected styling
            minWidth: 32,
            height:    32,
            margin:   '0 4px',
            '&.Mui-selected': {
              backgroundColor: theme.palette.mode === 'dark'
                  ? theme.palette.primary.dark
                  : theme.palette.info.main,
              color: theme.palette.mode === 'dark'
                ? theme.palette.primary.contrastText
                : theme.palette.info.contrastText,
              '&:hover': {
                backgroundColor: theme.palette.mode === 'dark'
                  ? theme.palette.primary.main
                  : theme.palette.info.light,
              },
            },  
          }),             
        },
      },
      MuiAccordion: {
        styleOverrides: {
          root: ({ theme }) => ({
            // Accordion panel base styling
            backgroundColor: theme.palette.background.paper,
            borderRadius: theme.shape.borderRadius,
            border: `1px solid ${theme.palette.divider}`,
            '&:before': { display: 'none' }
          }),
        },
      },
      MuiAccordionSummary: {
        styleOverrides: {
          root: ({ theme }) => ({
            // Accordion header styling
            backgroundColor: theme.palette.background.paper,
            borderRadius: theme.shape.borderRadius,
            '&.Mui-expanded': {
              borderBottomLeftRadius: 0,
              borderBottomRightRadius: 0,
            },
          }),
          expandIconWrapper: ({ theme }) => {
            // Expand icon circle styling
            const iconColor = theme.palette.mode === 'dark'
              ? theme.palette.text.primary
              : theme.palette.info.main;
            return {
              color: iconColor,
              borderRadius: '50%',
              padding: 4,
              '&:hover': {
                backgroundColor: theme.palette.action.hover
              },
            };
          },
        },
      },
      MuiAccordionDetails: {
        styleOverrides: {
          root: ({ theme }) => ({
            // Accordion details styling
            backgroundColor: theme.palette.background.paper,
            borderBottomLeftRadius: theme.shape.borderRadius,
            borderBottomRightRadius: theme.shape.borderRadius,
            '&.Mui-expanded': {
              borderBottomLeftRadius: theme.shape.borderRadius,
              borderBottomRightRadius: theme.shape.borderRadius,
            },
          }),
        },
      },
      MuiSwitch: {
        styleOverrides: {
          switchBase: ({ theme }) => ({
            // Switch thumb base color
            color: theme.palette.mode === 'dark'
                ? theme.palette.primary.dark
                : theme.palette.info.main,
          }),
          root: ({ theme }) => ({
            // Switch track and checked thumb styling
            '& .MuiSwitch-switchBase.Mui-checked .MuiSwitch-thumb': {
              color: theme.palette.mode === 'dark'
                ? theme.palette.primary.dark
                : theme.palette.info.main,
            },
            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
              backgroundColor: theme.palette.mode === 'dark'
                ? theme.palette.primary.dark
                : theme.palette.info.main,
            },
            '& .MuiSwitch-track': {
              backgroundColor: (theme.palette.mode === 'dark'
                ? theme.palette.primary.dark
                : theme.palette.info.main) + '80',
            },
          }),
        },
      },
    },
  });
};