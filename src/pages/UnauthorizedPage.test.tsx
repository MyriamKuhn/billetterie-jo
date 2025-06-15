import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// 1️⃣ Mock react-i18next's useTranslation to return t(key) => key
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    // If your code uses i18n.language etc, you can add stubs here
    i18n: { language: 'en' },
  }),
}));

// 2️⃣ Mock react-router-dom's useNavigate
const navigateMock = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = (await importOriginal()) as typeof import('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

// 3️⃣ Mock PageWrapper component
vi.mock('../components/PageWrapper', () => ({
  __esModule: true,
  // PageWrapper accepts disableCard and children; we render children inside a test-id wrapper
  PageWrapper: ({ disableCard, children }: any) => (
    <div data-testid="pagewrapper" data-disable-card={disableCard ? 'true' : 'false'}>
      {children}
    </div>
  ),
}));

// 4️⃣ Mock Seo component
vi.mock('../components/Seo', () => ({
  __esModule: true,
  default: ({ title, description }: { title?: string; description?: string }) => (
    <div data-testid="seo" data-title={title} data-description={description} />
  ),
}));

// 5️⃣ Import the component under test AFTER mocks
import UnauthorizedPage from './UnauthorizedPage';

describe('<UnauthorizedPage />', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Optionally reset window.location if used, but UnauthorizedPage uses useNavigate
  });

  it('renders Seo with correct title & description keys', () => {
    render(<UnauthorizedPage />);
    // Seo is mocked to render a div[data-testid="seo"]
    const seoDiv = screen.getByTestId('seo');
    // Since useTranslation.t returns the key, title prop should be 'seoTitle', description 'seoDescription'
    expect(seoDiv).toBeInTheDocument();
    expect(seoDiv).toHaveAttribute('data-title', 'seoTitle');
    expect(seoDiv).toHaveAttribute('data-description', 'seoDescription');
  });

  it('renders PageWrapper with disableCard=true and displays texts and button', () => {
    render(<UnauthorizedPage />);
    // PageWrapper wrapper
    const wrapper = screen.getByTestId('pagewrapper');
    expect(wrapper).toBeInTheDocument();
    // disableCard prop should be truthy; our mock writes data-disable-card
    expect(wrapper).toHaveAttribute('data-disable-card', 'true');

    // The component renders:
    // <Typography variant="h4">{t('access_denied')}</Typography>
    // <Typography variant="body1">{t('unauthorized')}</Typography>
    // <Button> {t('go_home')} </Button>
    // Since t returns the key itself, we expect to find text 'access_denied', 'unauthorized', 'go_home'
    expect(screen.getByRole('heading', { level: 4, name: 'access_denied' })).toBeInTheDocument();
    expect(screen.getByText('unauthorized')).toBeInTheDocument();
    // Button by role=button with name 'go_home'
    const btn = screen.getByRole('button', { name: 'go_home' });
    expect(btn).toBeInTheDocument();
  });

  it('clicking Go Home button calls navigate("/")', () => {
    render(<UnauthorizedPage />);
    const btn = screen.getByRole('button', { name: 'go_home' });
    fireEvent.click(btn);
    expect(navigateMock).toHaveBeenCalledTimes(1);
    expect(navigateMock).toHaveBeenCalledWith('/');
  });
});
