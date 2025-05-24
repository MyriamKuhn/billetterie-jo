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
  sections: readonly [string, string][];  // [subKey, textKey]
  makeId: (key: string) => string;
  titleKey: string;                       // ex. 'legal.subtitleTableOfContents'
  namespace: string;                      // ex. 'legal'
}

export function TableOfContents({
  sections,
  makeId,
  titleKey,
  namespace,
}: TocProps) {
  const theme = useTheme();
  const { t } = useTranslation(namespace);
  const [open, setOpen] = useState(false);

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
            {/* on traduit la clé du titre de section */}
            <ListItemText primary={t(`${namespace}.${subKey}`)} />
          </ListItemButton>
        );
      })}
    </List>
  );

  return (
    <>
      {/* Sidebar desktop */}
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
        <Typography variant="h6" gutterBottom>
          {t(titleKey)}
        </Typography>
        {TocList}
      </Box>

      {/* Drawer mobile */}
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
          ModalProps={{ keepMounted: true }}
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
