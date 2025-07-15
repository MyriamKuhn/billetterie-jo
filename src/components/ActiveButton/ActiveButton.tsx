import Button from '@mui/material/Button';
import type { ButtonProps } from '@mui/material/Button';
import ActiveLink from '../ActiveLink';

/**
 * Props for ActiveButton component.
 *
 * @extends Omit<ButtonProps, 'component'>
 * @property {string} to - The target URL to navigate to when clicked.
 */
interface Props extends Omit<ButtonProps, 'component'> {
  to: string;
}

/**
 * ActiveButton wraps MUI’s Button to use our custom ActiveLink for routing.
 *
 * It renders an outlined, primary-colored button that behaves like a link.
 *
 * @param {Props} props
 * @param {string} props.to - Destination route/path.
 * @param {React.ReactNode} props.children - Content of the button.
 * @returns {JSX.Element}
 */
function ActiveButton({ to, children, ...props }: Props) {
  return (
    <Button
      // Use ActiveLink as the underlying component for client-side navigation
      component={ActiveLink as React.ElementType}
      to={to}
      variant="outlined"
      color="primary"
      // Spread any other MUI Button props (e.g., size, disabled)
      {...props}
    >
      {children}
    </Button>
  );
}

export default ActiveButton;