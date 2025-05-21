import { createTheme } from '@mui/material/styles';

const brandColors = {
  primary:   '#68B9B5',  // turquoise logo
  secondary: '#0B1B2B',  // bleu nuit
  accent:    '#F8E1B0',  // crème flamme
  info:      '#0085C7',  // bleu anneau
  warning:   '#FFCD00',  // jaune anneau
  error:     '#E31937',  // rouge anneau
  success:   '#009739',  // vert anneau
};

export const getAppTheme = (mode: 'light' | 'dark') => {
  const isLight = mode === 'light';

  return createTheme({
    palette: {
      mode,
      primary: { main: brandColors.primary },
      secondary: { main: brandColors.secondary },
      error: { main: brandColors.error },
      warning: { main: brandColors.warning },
      info: { main: brandColors.info },
      success: { main: brandColors.success },
      background: {
        default: isLight ? '#F4F4F4' : '#121212',
        paper:   isLight ? '#FFFFFF' : '#0C1F2B',
      },
      text: {
        primary:   isLight ? '#0C1B2B' : '#F9E8C4',
        secondary: isLight ? '#576271' : '#C0C0C0',
      },
      divider: isLight ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.12)',
    },
    shape: { borderRadius: 10 },   
    shadows: [
      'none',
      '0px 1px 3px rgba(0,0,0,0.2)',
      '0px 1px 5px rgba(0,0,0,0.14)',
      '0px 1px 8px rgba(0,0,0,0.12)',
      '0px 2px 4px rgba(0,0,0,0.12)',
      '0px 3px 5px rgba(0,0,0,0.12)',
      '0px 3px 5px rgba(0,0,0,0.14)',
      '0px 4px 5px rgba(0,0,0,0.14)',
      '0px 5px 5px rgba(0,0,0,0.14)',
      '0px 6px 5px rgba(0,0,0,0.14)',
      '0px 7px 5px rgba(0,0,0,0.14)',
      '0px 8px 5px rgba(0,0,0,0.14)',
      '0px 9px 5px rgba(0,0,0,0.14)',
      '0px 10px 5px rgba(0,0,0,0.14)',
      '0px 11px 5px rgba(0,0,0,0.14)',
      '0px 12px 5px rgba(0,0,0,0.14)',
      '0px 13px 5px rgba(0,0,0,0.14)',
      '0px 14px 5px rgba(0,0,0,0.14)',
      '0px 15px 5px rgba(0,0,0,0.14)',
      '0px 16px 5px rgba(0,0,0,0.14)',
      '0px 17px 5px rgba(0,0,0,0.14)',
      '0px 18px 5px rgba(0,0,0,0.14)',
      '0px 19px 5px rgba(0,0,0,0.14)',
      '0px 20px 5px rgba(0,0,0,0.14)',
      '0px 21px 5px rgba(0,0,0,0.14)'
    ],    
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
