import type { User } from '../../types/user';
import { AdminUserCard } from '../AdminUserCard';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';
import { CreateEmployeeCard } from '../CreateEmployeeCard';

// Props interface defines the expected properties for the AdminUserGrid component.
interface Props {
  lang: string;
  users: User[];
  onViewDetails: (id: number) => void;
  onSave: (id: number, updates: {
    is_active: boolean;
    twofa_enabled: boolean;
    firstname: string;
    lastname: string;
    email: string;
    role: string;
    verify_email: boolean;
  }) => Promise<boolean>;
  onRefresh: () => void;
  isEmployee: boolean;
  onCreate: () => void;
}

/**
 * AdminUserGrid component displays a grid of user cards for admin management.
 * It allows viewing user details, saving changes, refreshing the list, and creating new employees.
 * @param {Props} props - The properties for the component.
 * @return {JSX.Element} The rendered component.
 */
export function AdminUserGrid({ lang, users, onViewDetails, onSave, onRefresh, isEmployee, onCreate }: Props) {
  const { t } = useTranslation('users');

  // If no users are passed, show a friendly 'not found' message
  if (users.length === 0) {
    return (
      <Typography variant="h4" sx={{ textAlign: 'center' }}>
        {isEmployee ? t('errors.not_found_employee') : t('errors.not_found')}
      </Typography>
    );
  }

  return (
    <Box sx={{ display: 'flex', gap: 4, justifyContent: { xs: 'center', md: 'flex-start' }, flexWrap: { xs: 'wrap', md: 'nowrap' }, flexDirection: { xs: 'row', md: 'column' }}}>
      {/* Optionally include create-card when managing employees */}
      {isEmployee && (
        <CreateEmployeeCard onCreate={onCreate} />
      )}
      {/* Render a card for each user in the list */}
      {users.map(user => (
        <AdminUserCard
          lang={lang}
          key={user.id}
          user={user}
          onViewDetails={() => onViewDetails(user.id)}
          onSave={onSave}
          onRefresh={onRefresh}
          isEmployee={isEmployee}
        />
      ))}
    </Box>
  );
}