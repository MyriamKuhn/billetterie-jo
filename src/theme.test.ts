import { createTheme } from '@mui/material/styles';
import { getAppTheme } from './theme';

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

const customShadows = {
  1: '0px 1px 3px rgba(0,0,0,0.2)',
  2: '0px 1px 5px rgba(0,0,0,0.14)',
  3: '0px 1px 8px rgba(0,0,0,0.12)',
  4: '0px 2px 4px rgba(0,0,0,0.12)',
};

const defaultTheme = createTheme();
const defaultShadows = defaultTheme.shadows;

// explicit modes
const modes: ReadonlyArray<'light' | 'dark'> = ['light', 'dark'];

describe('getAppTheme', () => {
  modes.forEach((mode) => {
    describe(`mode="${mode}"`, () => {
      const theme = getAppTheme(mode);

      it('sets palette.mode correctly', () => {
        expect(theme.palette.mode).toBe(mode);
      });

      it('applies brandColors to primary/secondary and semantic palettes', () => {
        expect(theme.palette.primary.main).toBe(brandColors.primary);
        expect(theme.palette.secondary.main).toBe(brandColors.secondary);
        expect(theme.palette.error.main).toBe(brandColors.error);
        expect(theme.palette.warning.main).toBe(brandColors.warning);
        expect(theme.palette.info.main).toBe(brandColors.info);
        expect(theme.palette.success.main).toBe(brandColors.success);
      });

      it('sets background and text from defaults', () => {
        expect(theme.palette.background.default).toBe(
          backgroundDefaults[mode].default
        );
        expect(theme.palette.background.paper).toBe(
          backgroundDefaults[mode].paper
        );
        expect(theme.palette.text.primary).toBe(
          textDefaults[mode].primary
        );
        expect(theme.palette.text.secondary).toBe(
          textDefaults[mode].secondary
        );
      });

      it('keeps divider contrast appropriate', () => {
        const expected =
          mode === 'light'
            ? 'rgba(0,0,0,0.12)'
            : 'rgba(255,255,255,0.12)';
        expect(theme.palette.divider).toBe(expected);
      });

      it('sets shape.borderRadius to 10', () => {
        expect(theme.shape.borderRadius).toBe(10);
      });

      it('overrides shadows index 1–4 and preserves others', () => {
        expect(theme.shadows).toHaveLength(defaultShadows.length);

        // custom entries
        Object.entries(customShadows).forEach(([idx, val]) => {
          expect(theme.shadows[Number(idx)]).toBe(val);
        });

        // an index beyond custom should be equal to original
        const idx = 7;
        expect(theme.shadows[idx]).toBe(defaultShadows[idx]);
      });

      it('preserves typography settings', () => {
        expect(theme.typography.fontFamily).toMatch(/Poppins/);
        expect(theme.typography.h1.fontWeight).toBe(700);
        expect(theme.typography.body1.fontSize).toBe('1rem');
      });
    });
  });
});

describe('getAppTheme – component styleOverrides', () => {
  modes.forEach((mode) => {
    const theme = getAppTheme(mode);
    const isLight = mode === 'light';

    describe(`mode="${mode}"`, () => {
      it('MuiCard – root overrides', () => {
        const fn = theme.components!.MuiCard!.styleOverrides!.root!;
        const styles = (fn as any)({ theme });
        expect(styles).toMatchObject({
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 10,
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          padding: '40px 20px',
        });
      });

      it('MuiButton – containedPrimary overrides (background, color & hover)', () => {
        const cp = theme.components!.MuiButton!.styleOverrides!.containedPrimary!;
        const styles = (cp as any)({ theme });
        // backgroundColor branch
        if (mode === 'dark') {
          expect(styles.backgroundColor).toBe(theme.palette.primary.dark);
          expect(styles.color).toBe(theme.palette.primary.contrastText);
          expect(styles['&:hover'].backgroundColor).toBe(theme.palette.primary.main);
        } else {
          expect(styles.backgroundColor).toBe(theme.palette.info.main);
          expect(styles.color).toBe(theme.palette.info.contrastText);
          expect(styles['&:hover'].backgroundColor).toBe(theme.palette.info.light);
        }
      });

      it(`MuiButton – outlinedPrimary ${isLight ? 'present' : 'absent'}`, () => {
        const outlined = (theme.components!.MuiButton!.styleOverrides as any).outlinedPrimary;
        if (isLight) {
          expect(outlined).toMatchObject({
            borderColor: brandColors.secondary,
            color: brandColors.secondary,
            '&:hover': {
              borderColor: brandColors.secondary,
              backgroundColor: `${brandColors.secondary}10`,
            },
          });
        } else {
          expect(outlined).toBeUndefined();
        }
      });

      it('MuiIconButton – root override', () => {
        const fn = theme.components!.MuiIconButton!.styleOverrides!.root!;
        const styles = (fn as any)({ theme });
        const expected = isLight
          ? theme.palette.info.main
          : theme.palette.text.primary;
        expect(styles).toEqual({ color: expected });
      });

      it('MuiListItemIcon – root override', () => {
        const fn = theme.components!.MuiListItemIcon!.styleOverrides!.root!;
        const styles = (fn as any)({ theme });
        const expected = isLight
          ? theme.palette.info.main
          : theme.palette.text.primary;
        expect(styles).toEqual({ color: expected });
      });

      it('MuiBadge – badge overrides', () => {
        const fn = theme.components!.MuiBadge!.styleOverrides!.badge!;
        const styles = (fn as any)({ theme });
        expect(styles).toMatchObject({
          backgroundColor: isLight
            ? theme.palette.text.primary
            : theme.palette.info.main,
          color: '#fff',
          minWidth: 16,
          height: 16,
          fontSize: '0.625rem',
          borderRadius: '50%',
          transform: 'translate(35%, 35%)',
        });
      });

      it('MuiLink – root override', () => {
        const fn = theme.components!.MuiLink!.styleOverrides!.root!;
        const styles = (fn as any)({ theme });
        const expectedColor = isLight
          ? theme.palette.primary.dark
          : theme.palette.primary.light;
        expect(styles).toMatchObject({
          color: expectedColor,
          textDecoration: 'underline',
          '&:hover': { color: theme.palette.primary.main },
        });
      });

      it('MuiRadio – root override', () => {
        const rootOverride = theme.components!.MuiRadio!.styleOverrides!.root!;
        const styles = (rootOverride as any)({ theme });
        expect(styles).toMatchObject({
          color: theme.palette.text.secondary,
          '&.Mui-checked': {
            color:
              theme.palette.mode === 'dark'
                ? theme.palette.primary.dark
                : theme.palette.info.main,
          },
        });
      });

      it('MuiPagination – root override', () => {
        const rootStyles = theme.components!.MuiPagination!.styleOverrides!.root!;
        expect(rootStyles).toEqual({
          display: 'flex',
          justifyContent: 'center',
          padding: '1rem 0',
        });
      });

      it('MuiPaginationItem – root override', () => {
        const fn = theme.components!.MuiPaginationItem!.styleOverrides!.root!;
        const styles = (fn as any)({ theme });

        // Vérifie les propriétés de base
        expect(styles).toMatchObject({
          minWidth: 32,
          height: 32,
          margin: '0 4px',
        });

        // Vérifie le style pour l’état sélectionné
        const selected = styles['&.Mui-selected'];
        expect(selected).toMatchObject({
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
        });
      });

      it('MuiButton – text overrides for light mode when ownerState.color !== "inherit"', () => {
        const textOverride = theme.components!.MuiButton!.styleOverrides!.text!;
        // simule ownerState.color != 'inherit'
        const styles = (textOverride as any)({
          theme,
          ownerState: { color: 'primary' }
        });
        if (isLight) {
          expect(styles).toMatchObject({
            color: theme.palette.info.main,
            '&:hover': { backgroundColor: `${theme.palette.info.main}10` }
          });
        } else {
          // en dark, on retourne toujours {}
          expect(styles).toEqual({});
        }
      });

      it('MuiButton – text returns empty object when ownerState.color === "inherit"', () => {
        const textOverride = theme.components!.MuiButton!.styleOverrides!.text!;
        const styles = (textOverride as any)({
          theme,
          ownerState: { color: 'inherit' }
        });
        expect(styles).toEqual({});
      });
    });
  });
});
