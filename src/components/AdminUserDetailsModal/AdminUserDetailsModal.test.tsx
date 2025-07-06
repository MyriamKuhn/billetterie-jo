import { render, screen } from '@testing-library/react';
import { AdminUserDetailsModal } from './AdminUserDetailsModal';
import axios from 'axios';
import { vi, type Mock } from 'vitest';
import { API_BASE_URL } from '../../config';

// Mock modules
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
vi.mock('../OlympicLoader', () => ({
  __esModule: true,
  default: () => <div data-testid="loader" />, 
}));
vi.mock('../ErrorDisplay', () => ({
  __esModule: true,
  ErrorDisplay: ({ title, message }: any) => (
    <div data-testid="error">
      <span>{title}</span>
      <span>{message}</span>
    </div>
  ),
}));
vi.mock('../../utils/format', () => ({
  formatDate: (iso: string, lang: string) => `DATE(${iso},${lang})`,  
  formatTime: (iso: string, lang: string) => `TIME(${iso},${lang})`,  
}));
vi.mock('../../utils/logger', () => ({ logError: vi.fn() }));
vi.mock('axios', () => ({
  __esModule: true,
  default: { get: vi.fn() },
}));

const getMock = (axios as any).get as Mock;
const onClose = vi.fn();
const userId = 7;
const token = 'token123';
const lang = 'en';

describe('AdminUserDetailsModal', () => {
  beforeEach(() => {
    getMock.mockReset();
    onClose.mockClear();
  });

  it('does not fetch when closed or userId is null', () => {
    render(
      <AdminUserDetailsModal open={false} userId={userId} token={token} onClose={onClose} lang={lang} isEmployee={false} />
    );
    render(
      <AdminUserDetailsModal open userId={null} token={token} onClose={onClose} lang={lang} isEmployee={false} />
    );
    expect(getMock).not.toHaveBeenCalled();
  });

  it('displays error on fetch failure for user', async () => {
    getMock.mockRejectedValueOnce(new Error('fail'));

    render(
      <AdminUserDetailsModal open userId={userId} token={token} onClose={onClose} lang={lang} isEmployee={false} />
    );

    expect(await screen.findByTestId('error')).toBeInTheDocument();
    expect(screen.getByText('errors.title')).toBeInTheDocument();
    expect(screen.getByText('errors.error_user')).toBeInTheDocument();
  });

  it('displays error on fetch failure for employee', async () => {
    getMock.mockRejectedValueOnce(new Error('fail'));

    render(
      <AdminUserDetailsModal open userId={userId} token={token} onClose={onClose} lang={lang} isEmployee={true} />
    );

    expect(await screen.findByTestId('error')).toBeInTheDocument();
    expect(screen.getByText('errors.title')).toBeInTheDocument();
    expect(screen.getByText('errors.error_employee')).toBeInTheDocument();
  });

  it('affiche le bloc pendingEmail quand l’API renvoie des données', async () => {
    const userData = {
      firstname: 'John',
      lastname: 'Doe',
      email: 'john.doe@example.com',
    };
    const pendingData = {
      old_email: 'old@example.com',
      new_email: 'new@example.com',
      created_at: '2025-07-01T10:00:00Z',
      updated_at: '2025-07-02T12:00:00Z',
    };

    getMock.mockImplementation((url: string) => {
      if (url === `${API_BASE_URL}/api/users/${userId}`) {
        return Promise.resolve({ data: { user: userData } });
      }
      if (url === `${API_BASE_URL}/api/users/email/${userId}`) {
        return Promise.resolve({ data: { data: pendingData } });
      }
      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    });

    render(
      <AdminUserDetailsModal
        open
        userId={userId}
        token={token}
        onClose={onClose}
        lang={lang}
        isEmployee={false}
      />
    );

    // On attend que le nom soit affiché pour s'assurer que loading est fini
    await screen.findByText('John Doe');

    // Vérifie le titre et le contenu du bloc pendingEmail
    expect(screen.getByText('user.pending_email_change')).toBeInTheDocument();
    expect(screen.getByText(`user.old_email: ${pendingData.old_email}`)).toBeInTheDocument();
    expect(screen.getByText(`user.new_email: ${pendingData.new_email}`)).toBeInTheDocument();
    expect(screen.getByText('user.requested_on')).toBeInTheDocument();
    expect(screen.getByText('user.updated_on')).toBeInTheDocument();
  });

  it('affiche le message no_pending_email quand il n’y a pas de pendingEmail', async () => {
    const userData = {
      firstname: 'Jane',
      lastname: 'Roe',
      email: 'jane.roe@example.com',
    };

    // 1) on mock le user
    getMock.mockImplementation((url: string) => {
      if (url === `${API_BASE_URL}/api/users/${userId}`) {
        return Promise.resolve({ data: { user: userData } });
      }
      // 2) on renvoie null pour le pendingEmail
      if (url === `${API_BASE_URL}/api/users/email/${userId}`) {
        return Promise.resolve({ data: { data: null } });
      }
      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    });

    render(
      <AdminUserDetailsModal
        open
        userId={userId}
        token={token}
        onClose={onClose}
        lang={lang}
        isEmployee={false}
      />
    );

    // On attend la fin du loader
    await screen.findByText('Jane Roe');

    // On doit maintenant voir le message user.no_pending_email
    expect(screen.getByText('user.no_pending_email')).toBeInTheDocument();

    // Et le bloc pending_email_change ne doit pas exister
    expect(screen.queryByText('user.pending_email_change')).toBeNull();
  });
});
