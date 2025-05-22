// src/theme.test.ts
import { createTheme } from '@mui/material/styles';
import { getAppTheme } from './theme';

describe('getAppTheme', () => {
  const brandColors = {
    primary:   '#68B9B5',
    secondary: '#0B1B2B',
    error:     '#E31937',
    warning:   '#FFCD00',
    info:      '#0085C7',
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

  // explicitly type modes as a readonly tuple
  const modes: ReadonlyArray<'light' | 'dark'> = ['light', 'dark'];

  modes.forEach((mode: 'light' | 'dark') => {
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

      it('inherits default shape.borderRadius', () => {
        expect(theme.shape.borderRadius).toBe(10);
      });

      it('overrides shadows index 1–4 and preserves others', () => {
        // length matches default
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

