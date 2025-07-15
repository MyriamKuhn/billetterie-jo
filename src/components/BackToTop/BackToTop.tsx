import React from 'react';
import Box              from '@mui/material/Box';
import Fab              from '@mui/material/Fab';
import useScrollTrigger from '@mui/material/useScrollTrigger';
import Zoom             from '@mui/material/Zoom';
import { useTheme }     from '@mui/material/styles';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { useTranslation } from 'react-i18next';

interface ScrollTopProps {
  window?: () => Window;  // Optional window ref for use in iframes or custom scroll targets
}

/**
 * ScrollTop:
 * Wraps children in a Zoom transition when page is scrolled past a threshold (100px).
 * On click, smoothly scrolls to the element with id 'back-to-top-anchor'.
 */
export function ScrollTop(props: ScrollTopProps & { children: React.ReactElement }) {
  const { children, window } = props;
  // Trigger becomes true when scrolled beyond threshold
  const trigger = useScrollTrigger({
    target: window ? window() : undefined,
    disableHysteresis: true,  // trigger instantly on scroll direction change
    threshold: 100, // show after 100px scroll
  });

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    // Find the anchor element to scroll to
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
 * BackToTop:
 * To be included in App.tsx. Renders an invisible anchor and a ScrollTop wrapper
 * containing a themed Fab button with an up arrow icon.
 */
export default function BackToTop(props: ScrollTopProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <React.Fragment>
      {/* Anchor element for scroll target */}
      <Box id="back-to-top-anchor" />
      {/* Wrap FAB in ScrollTop to show/hide on scroll */}
      <ScrollTop {...props}>
        <Fab
          size="small"
          aria-label={t('scroll.back_to_top')}  // Accessible label for screen readers
          sx={{
            bgcolor: isDark ? 'primary.dark' : 'info.main',
            color: isDark ? 'primary.contrastText' : 'info.contrastText',
            '&:hover': {
              bgcolor: isDark ? 'primary.main' : 'info.light',
            },
          }}
        >
          <KeyboardArrowUpIcon /> // Up arrow icon inside the FAB
        </Fab>
      </ScrollTop>
    </React.Fragment>
  );
}
