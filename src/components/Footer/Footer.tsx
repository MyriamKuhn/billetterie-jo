import Box        from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import ActiveButton from '../ActiveButton';
import { useTranslation } from 'react-i18next';

/**
 * A responsive site footer with navigation links and copyright notice.
 * It adapts to mobile and desktop layouts, displaying links in a row on larger screens
 * and in a column on smaller screens. The footer includes links to contact, legal mentions,
 * terms of service, and privacy policy, along with a copyright notice that updates,
 * dynamically to the current year.
 */
function Footer() {
  const theme    = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { t }    = useTranslation();

  // Footer navigation links with route and translation key
  const links = [
    { to: '/contact',         labelKey: 'footer.contact'       },
    { to: '/legal-mentions',  labelKey: 'footer.legalMentions' },
    { to: '/terms',           labelKey: 'footer.terms'         },
    { to: '/privacy-policy',  labelKey: 'footer.privacy'       },
  ];

  return (
    <Box component="footer" sx={{
      bgcolor:     theme.palette.background.paper,
      color:       theme.palette.text.primary,
      borderTop:   `1px solid ${theme.palette.divider}`,
    }}>
      {/* Navigation button row: horizontal on desktop, vertical on mobile */}
      <Box
        sx={{
          display:        'flex',
          flexDirection:  isMobile ? 'column' : 'row',
          alignItems:     'center',
          justifyContent: 'center',
          gap:            isMobile ? 1 : 2,
          py:             isMobile ? 1 : 1.5,
        }}
      >
        {links.map(link => (
          <ActiveButton
            key={link.to}
            to={link.to}
            variant="text"             
            size="small"                
            sx={{
              fontSize:   isMobile ? '0.7rem' : '0.8rem',
              color:      theme.palette.text.primary,
            }}
          >
            {t(link.labelKey)}
          </ActiveButton>
        ))}
      </Box>

      {/* Copyright section */}
      <Box sx={{
        py: isMobile ? 0.5 : 1,
      }}>
        <Typography
          variant="caption"
          component="div"
          align="center"
          sx={{
            color: theme.palette.text.secondary,
            fontSize: isMobile ? '0.5rem' : '0.6rem',
            lineHeight:1,
          }}
        >
          {t('footer.copy', { year: new Date().getFullYear() })}
        </Typography>
      </Box>
    </Box>
  );
}

export default Footer;
