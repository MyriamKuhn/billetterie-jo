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

export const getAppTheme = (mode: PaletteMode): Theme => {
  const isLight = mode === 'light';

  const defaultTheme = createTheme();
  const defaultShadows: Shadows = defaultTheme.shadows;

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
          containedPrimary: {
            backgroundColor: brandColors.primary,
            color: '#0B1B2B',
            '&:hover': { backgroundColor: '#57A5A2' }
          },
          ...(isLight && {
            outlinedPrimary: {
              borderColor:     brandColors.secondary,  
              color:           brandColors.secondary,
              '&:hover': {
                borderColor:     brandColors.secondary,
                backgroundColor: `${brandColors.secondary}10`, 
              },
            }
          })
        }
      },
      MuiIconButton: {
        styleOverrides: {
          root: ({ theme }) => ({
            color: isLight ? theme.palette.info.main : theme.palette.text.primary,
          }),
        },
      },
      MuiListItemIcon: {
        styleOverrides: {
          root: ({ theme }) => ({
            color: isLight ? theme.palette.info.main : theme.palette.text.primary,
          }),
        },
      },
      MuiBadge: {
        styleOverrides: {
          badge: ({ theme }) => ({
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
          root: {
            color: brandColors.primary,
          },
        },
      },
    }                    
  });
};
