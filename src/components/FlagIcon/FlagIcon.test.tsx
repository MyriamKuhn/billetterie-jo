import { render, screen } from '@testing-library/react';
import FlagIcon, { type CountryCode } from './FlagIcon';

describe('<FlagIcon />', () => {
  it.each<CountryCode>(['FR', 'US', 'DE'])(
    'renders the %s flag with default props',
    (code) => {
      render(<FlagIcon code={code} />);
      const img = screen.getByRole('img', { name: `Flag ${code}` });
      expect(img).toBeInTheDocument();
      // Le SVG est inclus en Data URI
      expect(img).toHaveAttribute('src');
      expect(img.getAttribute('src')).toMatch(/^data:image\/svg\+xml[,;]/);
      expect(img).toHaveAttribute('width', '24');
      expect(img).toHaveAttribute('height', '16');
      expect(img).toHaveAttribute('alt', `Flag ${code}`);
      // pas de className ni de style inline
      expect(img).not.toHaveAttribute('class');
      expect(img).not.toHaveAttribute('style');
    }
  );

  it('accepts custom width, height, className and style', () => {
    const style = { border: '1px solid red' };
    render(
      <FlagIcon
        code="US"
        width={48}
        height={32}
        className="my-flag"
        style={style}
      />
    );
    const img = screen.getByRole('img', { name: 'Flag US' });
    expect(img).toHaveAttribute('width', '48');
    expect(img).toHaveAttribute('height', '32');
    expect(img).toHaveClass('my-flag');
    // style est bien appliqué
    expect(img).toHaveStyle('border: 1px solid red');
  });
});
