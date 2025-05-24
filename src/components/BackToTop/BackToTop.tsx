import React from 'react';
import Box              from '@mui/material/Box';
import Fab              from '@mui/material/Fab';
import useScrollTrigger from '@mui/material/useScrollTrigger';
import Zoom             from '@mui/material/Zoom';
import { useTheme }     from '@mui/material/styles';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';

interface ScrollTopProps {
  /**
   * Optional window ref (pour les iframes etc).
   */
  window?: () => Window;
}

/**
 * Ce composant affiche son enfant dans un Zoom quand on scroll (threshold = 100px).
 */
export function ScrollTop(props: ScrollTopProps & { children: React.ReactElement }) {
  const { children, window } = props;
  const trigger = useScrollTrigger({
    target: window ? window() : undefined,
    disableHysteresis: true,
    threshold: 100,
  });

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    const anchor = (
      (event.currentTarget as HTMLElement).ownerDocument || document
    ).querySelector('#back-to-top-anchor');

    if (anchor) {
      anchor.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <Zoom in={trigger}>
      <Box
        onClick={handleClick}
        role="presentation"
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          zIndex: 1300,
        }}
      >
        {children}
      </Box>
    </Zoom>
  );
}

/**
 * Composant à importer dans App.tsx
 */
export default function BackToTop(props: ScrollTopProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <React.Fragment>
      {/* L'ancre qu'on remontera */}
      <Box id="back-to-top-anchor" />
      <ScrollTop {...props}>
        <Fab
          size="small"
          aria-label="scroll back to top"
          sx={{
            bgcolor: isDark ? 'primary.dark' : 'info.main',
            color: isDark ? 'primary.contrastText' : 'info.contrastText',
            '&:hover': {
              bgcolor: isDark ? 'primary.main' : 'info.light',
            },
          }}
        >
          <KeyboardArrowUpIcon />
        </Fab>
      </ScrollTop>
    </React.Fragment>
  );
}
