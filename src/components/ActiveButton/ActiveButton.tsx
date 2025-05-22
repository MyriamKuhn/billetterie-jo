import Button from '@mui/material/Button';
import type { ButtonProps } from '@mui/material/Button';
import ActiveLink from '../ActiveLink';

interface Props extends Omit<ButtonProps, 'component'> {
  to: string;
}

function ActiveButton({ to, children, ...props }: Props) {
  return (
    <Button
      component={ActiveLink as React.ElementType}
      to={to}
      variant="outlined"
      color="primary"
      {...props}
    >
      {children}
    </Button>
  );
}

export default ActiveButton;