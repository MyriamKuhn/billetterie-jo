import { Button, type ButtonProps } from '@mui/material';
import { ActiveLink } from '../ActiveLink';

interface Props extends Omit<ButtonProps, 'component'> {
  to: string;
}

export function ActiveButton({ to, children, ...props }: Props) {
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
