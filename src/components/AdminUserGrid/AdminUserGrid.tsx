import type { User } from '../../types/user';
import { AdminUserCard } from '../AdminUserCard';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';
import { CreateEmployeeCard } from '../CreateEmployeeCard';

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

export function AdminUserGrid({ lang, users, onViewDetails, onSave, onRefresh, isEmployee, onCreate }: Props) {
  const { t } = useTranslation('users');

  if (users.length === 0) {
    return (
      <Typography variant="h4" sx={{ textAlign: 'center' }}>
        {isEmployee ? t('errors.not_found_employee') : t('errors.not_found')}
      </Typography>
    );
  }

  return (
    <Box sx={{ display: 'flex', gap: 4, justifyContent: { xs: 'center', md: 'flex-start' }, flexWrap: { xs: 'wrap', md: 'nowrap' }, flexDirection: { xs: 'row', md: 'column' }}}>
      {isEmployee && (
        <CreateEmployeeCard onCreate={onCreate} />
      )}
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