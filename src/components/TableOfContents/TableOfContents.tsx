import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Drawer from '@mui/material/Drawer';
import MenuIcon from '@mui/icons-material/Menu';

interface TocProps {
  /** Array of sections defined as [subKey, textKey] tuples */
  sections: readonly [string, string][]; 
  /** Function to generate an anchor ID from a section key */ 
  makeId: (key: string) => string;
  /** i18n key for the TOC title (e.g. 'legal.subtitleTableOfContents') */
  titleKey: string; 
  /** i18n namespace for translating section titles */                     
  namespace: string;                     
}

/**
 * TableOfContents:
 * - On desktop: renders a sticky sidebar with links to each section anchor.
 * - On mobile: shows a menu icon that opens a Drawer containing the same list.
 */
export function TableOfContents({
  sections,
  makeId,
  titleKey,
  namespace,
}: TocProps) {
  const theme = useTheme();
  const { t } = useTranslation(namespace);
  const [open, setOpen] = useState(false);

  // Shared list of links to section anchors
  const TocList = (
    <List disablePadding>
      {sections.map(([subKey]) => {
        const anchor = makeId(subKey);
        return (
          <ListItemButton
            key={subKey}
            component="a"
            href={`#${anchor}`}
            sx={{ pl: 2 }}
            onClick={() => setOpen(false)}
          >
            <ListItemText primary={t(`${namespace}.${subKey}`)} />
          </ListItemButton>
        );
      })}
    </List>
  );

  return (
    <>
      {/* Desktop sidebar (hidden on xs) */}
      <Box
        component="nav"
        sx={{
          display: { xs: 'none', md: 'block' },
          position: 'sticky',
          top: theme.mixins.toolbar.minHeight,
          width: 240,
          bgcolor: 'background.paper',
          border: theme => `1px solid ${theme.palette.divider}`,
          borderRadius: 1,
          p: 2,
          flexShrink: 0,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          overscrollBehaviorY: 'contain',
        }}
      >
        {/* TOC title */}
        <Typography variant="h6" gutterBottom>
          {t(titleKey)}
        </Typography>
        {TocList}
      </Box>

      {/* Mobile drawer (hidden on md+) */}
      <Box sx={{ display: { xs: 'block', md: 'none' }, mb: 2 }}>
        <IconButton
          onClick={() => setOpen(true)}
          aria-label={t(titleKey)}
        >
          <MenuIcon />
        </IconButton>
        <Drawer
          anchor="left"
          open={open}
          onClose={() => setOpen(false)}
          ModalProps={{ keepMounted: true }}  // Improve performance on mobile
        >
          <Box
            role="presentation"
            sx={{
              width: 250,
              p: 2,
              bgcolor: 'background.paper',
              height: '100%',
              overflowY: 'auto',
              WebkitOverflowScrolling: 'touch',
              overscrollBehaviorY: 'contain',
            }}
          >
            {/* TOC title inside drawer */}
            <Typography variant="h6" gutterBottom>
              {t(titleKey)}
            </Typography>
            {TocList}
          </Box>
        </Drawer>
      </Box>
    </>
  );
}
